import { NextResponse } from 'next/server';
import moment from 'moment';

import withAuthApi from '@libs/auth/withAuthApi';
import { initTranslationsApi } from '@libs/translate/functions';
import { prismaRead, TransactionError, withTransaction } from '@libs/prisma';
import { billingDefaultActivityCode, billingPaymentConditions } from '@/libs/constants';
import { generateDocument } from '@/services/easytax';

import { Currency, InvoicePaymentCondition, InvoiceStatus, InvoiceType, PaymentMethod } from '@/prisma/generated/enums';

import { getOpenCashRegister } from '@/controllers/CashRegister.Controller';
import { isValidBillingInformation } from '@/controllers/Client.Controller';
import {
  buildCreateDocumentPayload,
  getMostValuablePayment,
  validateAdditionalChargesCC,
  validateLinesCC,
  validatePayments
} from '@/controllers/Invoice.Controller';
import { getConfiguration } from '@/controllers/Configuration.Controller';
import {
  calculateBillingCCTotal,
  calculateBillingChangeAmount,
  calculateBillingPaidAmount
} from '@/helpers/calculations';

export const POST = withAuthApi(['billing.create'], async (req) => {
  const { t } = await initTranslationsApi(req);
  const textT: any = t('api:billing', { returnObjects: true, default: {} });

  const admin = req.session;
  const data = await req.json();

  try {
    const clientId = parseInt(data.client_id);
    const invoiceType = data.type as InvoiceType;
    const customPaymentCondition = data.payment_condition as keyof typeof billingPaymentConditions;
    const paymentCondition = billingPaymentConditions[customPaymentCondition]?.type || InvoicePaymentCondition.CASH;
    const paymentConditionDays = billingPaymentConditions[customPaymentCondition]?.days || 0;
    const baseCurrency = data.currency as Currency;
    const lines = data.lines;
    const payments = data.payments;
    const hasToValidatePayments = paymentCondition === InvoicePaymentCondition.CASH;

    // validate if admin has open cash register
    const cashRegister = await getOpenCashRegister(admin.id);
    if (!cashRegister) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noOpenCash }, { status: 400 });
    }

    // validate currency
    if (!Object.values(Currency).includes(baseCurrency)) {
      return NextResponse.json({ valid: false, message: textT?.errors?.invalidCurrency }, { status: 400 });
    }

    // get configuration
    const configuration = await getConfiguration();
    if (!configuration) {
      return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 400 });
    }

    // validate client and billing information
    const client = await prismaRead.cusClient.findUnique({
      where: { id: clientId, office_id: cashRegister.office.id }
    });
    if (!client) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noClient }, { status: 400 });
    }
    if (!isValidBillingInformation(client)) {
      return NextResponse.json({ valid: false, message: textT?.errors?.noClientBillingInfo }, { status: 400 });
    }

    // validate lines
    const { valid: linesValid, data: linesData, errors: linesErrors } = await validateLinesCC(lines);
    if (!linesValid) {
      return NextResponse.json(
        { valid: false, message: textT?.errors?.linesError?.replace('{{ errors }}', linesErrors?.join(', ') || '') },
        { status: 400 }
      );
    }

    // validate additional charges lines
    const {
      valid: additionalChargesValid,
      data: additionalChargesData,
      errors: additionalChargesErrors
    } = await validateAdditionalChargesCC(data.additional_charges);
    if (!additionalChargesValid) {
      return NextResponse.json(
        {
          valid: false,
          message: textT?.errors?.additionalChargesError?.replace(
            '{{ errors }}',
            additionalChargesErrors?.join(', ') || ''
          )
        },
        { status: 400 }
      );
    }

    // validate that there is something to bill
    if ((!linesData || linesData.length === 0) && (!additionalChargesData || additionalChargesData.length === 0)) {
      return NextResponse.json({ valid: false, message: textT?.errors?.nothingToBill }, { status: 400 });
    }

    // validate payments
    const { valid: paymentsValid, data: paymentsData, errors: paymentsErrors } = validatePayments(payments);
    if (hasToValidatePayments && !paymentsValid) {
      return NextResponse.json(
        {
          valid: false,
          message: textT?.errors?.paymentsError?.replace('{{ errors }}', paymentsErrors?.join(', ') || '')
        },
        { status: 400 }
      );
    }

    // validate totals
    const totals = calculateBillingCCTotal(
      linesData || [],
      additionalChargesData || [],
      baseCurrency,
      configuration.selling_exchange_rate,
      configuration.buying_exchange_rate,
      configuration.iva_percentage
    );
    const paidAmount = calculateBillingPaidAmount(
      paymentsData || [],
      baseCurrency,
      configuration.selling_exchange_rate,
      configuration.buying_exchange_rate
    );
    if (hasToValidatePayments && paidAmount < totals.total) {
      return NextResponse.json({ valid: false, message: textT?.errors?.notEnoughPaidAmount }, { status: 400 });
    }

    // create invoice and send to easytax service
    const result = await withTransaction(async (tx) => {
      // 1: generate invoice variables
      const changeAmountCRC = calculateBillingChangeAmount(
        paidAmount,
        totals.total,
        baseCurrency,
        configuration.buying_exchange_rate
      );
      const mostValuablePayment = getMostValuablePayment(paymentsData || [], configuration.buying_exchange_rate);

      // 2: create invoice with lines and payments
      const invoice = await tx.cusInvoice.create({
        data: {
          cash_register_id: cashRegister.id,
          client_id: client.id,
          consecutive: '',
          numeric_key: '',
          type: invoiceType,
          payment_condition: paymentCondition,
          payment_condition_days: paymentConditionDays,
          selling_exchange_rate: configuration.selling_exchange_rate,
          buying_exchange_rate: configuration.buying_exchange_rate,
          client_name: client.billing_full_name,
          client_identification: client.billing_identification,
          client_email: client.billing_email,
          client_activity_code: client.billing_activity_code || billingDefaultActivityCode,
          currency: baseCurrency,
          payment_method: mostValuablePayment?.method || PaymentMethod.CASH,
          payment_method_ref: mostValuablePayment?.ref || '',
          subtotal: totals.subtotal,
          tax: totals.taxes,
          total: totals.total,
          cash_change: changeAmountCRC,
          status: paymentCondition === InvoicePaymentCondition.CASH ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
          paid_at: paymentCondition === InvoicePaymentCondition.CASH ? new Date() : null,
          expired_at: moment().add(paymentConditionDays, 'days').toDate(),
          created_at: moment().toDate(),
          invoice_lines: {
            createMany: {
              data:
                linesData?.map((line) => ({
                  iva_percentage: configuration.iva_percentage,
                  code: line.code,
                  cabys: line.cabys,
                  description: line.description,
                  currency: line.currency,
                  quantity: line.quantity,
                  unit_price: line.unit_price,
                  total: line.total,
                  is_exempt: line.is_exempt
                })) || []
            }
          },
          invoice_additional_charges: {
            createMany: {
              data:
                additionalChargesData?.map((charge) => ({
                  type: charge.type,
                  type_description: charge.type_description,
                  third_party_identification: charge.third_party_identification,
                  third_party_name: charge.third_party_name,
                  details: charge.details,
                  percentage: 0,
                  currency: charge.currency,
                  amount: charge.amount
                })) || []
            }
          },
          invoice_payments: {
            createMany: {
              data:
                paymentsData?.map((payment) => ({
                  currency: payment.currency,
                  payment_method: payment.method,
                  ref: payment.ref || '',
                  ref_bank: payment.ref_bank || '',
                  amount: payment.amount
                })) || []
            }
          }
        },
        include: {
          invoice_lines: true,
          invoice_additional_charges: true
        }
      });
      if (!invoice) {
        throw new TransactionError(400, textT?.errors?.save);
      }

      // 3: send invoice to easytax service
      const documentPayload = buildCreateDocumentPayload({
        configuration,
        office: cashRegister.office,
        invoice,
        lines: invoice.invoice_lines || [],
        additionalCharges: invoice.invoice_additional_charges || []
      });
      const easytaxResponse = await generateDocument(documentPayload);
      if (!easytaxResponse.valid) {
        throw new TransactionError(500, textT?.errors?.save);
      }

      // 4: save easytax response data
      await tx.cusInvoice.update({
        where: { id: invoice.id },
        data: {
          consecutive: easytaxResponse.consecutive,
          numeric_key: easytaxResponse.numericKey
        }
      });

      // 5: save log
      await tx.cusInvoiceLog.create({
        data: {
          invoice_id: invoice.id,
          administrator_id: admin.id,
          action: 'invoice.create',
          data: data
        }
      });

      return { id: invoice.id, change: changeAmountCRC };
    });

    return NextResponse.json({ valid: true, ...result }, { status: 200 });
  } catch (error) {
    console.error(`Error: ${error}`);

    if (error instanceof TransactionError) {
      return NextResponse.json({ valid: false, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ valid: false, message: textT?.errors?.general }, { status: 500 });
  }
});

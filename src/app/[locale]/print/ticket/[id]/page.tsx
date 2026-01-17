import '../../print.css';
import './styles.css';

// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
// import { getUser } from '@controllers/User.Controller';

// Components Imports
import Ticket from '@/views-cus/print/Ticket';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

async function getTicket(id: string) {
  // Replace with your DB call / API fetch
  return {
    id,
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Product A', qty: 1, price: 10 },
      { name: 'Product B', qty: 2, price: 5 }
    ]
  };
}

const TicketPrintPage = withAuthPage([], async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
  const { id } = await params;

  const ticket = await getTicket(id);
  if (!ticket) {
    redirect('/not-found');
  }

  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Ticket ticket={ticket} />
    </TranslationsProvider>
  );
});

export default TicketPrintPage;

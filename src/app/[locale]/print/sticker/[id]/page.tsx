import '../../print.css';
import './styles.css';

// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
// import { getUser } from '@controllers/User.Controller';

// Components Imports
import Sticker from '@/views-cus/print/Sticker';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

async function getSticker(id: string) {
  // Replace with your DB call / API fetch
  return {
    id,
    sku: 'SKU-12345',
    name: 'Product Name',
    price: 12.99
  };
}

const StickerPrintPage = withAuthPage([], async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
  const { id } = await params;

  const sticker = await getSticker(id);
  if (!sticker) {
    redirect('/not-found');
  }

  return (
    <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
      <Sticker sticker={sticker} />
    </TranslationsProvider>
  );
});

export default StickerPrintPage;

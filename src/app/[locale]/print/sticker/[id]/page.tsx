import '../../print.css';
import './styles.css';

// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getSticker } from '@/controllers/Sticker.Controller';

// Components Imports
import Sticker from '@/views-cus/print/Sticker';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const StickerPrintPage = withAuthPage([], async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
  const { id: tracking } = await params;

  const sticker = await getSticker(tracking);
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

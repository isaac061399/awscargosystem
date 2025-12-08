// Next Imports
import { redirect } from 'next/navigation';

// Controller Imports
import { getMenu } from '@controllers/Menu.Controller';

// Components Imports
import MenusEdition from '@views/menus/MenusEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const MenusEditPage = withAuthPage(
  ['menus.edit'],
  async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
    const { id } = await params;
    const menu = await getMenu(Number(id));

    if (!menu) {
      redirect('/not-found');
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <MenusEdition menu={menu} />
      </TranslationsProvider>
    );
  }
);

export default MenusEditPage;

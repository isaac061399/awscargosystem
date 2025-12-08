// Controller Imports
import { getMenu } from '@controllers/Menu.Controller';

// Components Imports
import MenusEdition from '@views/menus/MenusEdition';

// Server Action Imports
import withAuthPage from '@libs/auth/withAuthPage';
import { getNextPath } from '@libs/translate/functions';
import TranslationsProvider from '@libs/translate/TranslationProvider';

const MenusNewPage = withAuthPage(
  ['menus.create'],
  async ({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ ref: string }> }) => {
    const { ref } = await searchParams;
    const props: { menu?: any; isDuplicated?: boolean } = {};

    if (ref) {
      const menu = await getMenu(Number(ref));

      if (menu) {
        props.menu = menu;
        props.isDuplicated = true;
      }
    }

    return (
      <TranslationsProvider page={getNextPath(__dirname)} locale={(await params).locale}>
        <MenusEdition {...props} />
      </TranslationsProvider>
    );
  }
);

export default MenusNewPage;

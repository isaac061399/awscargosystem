import { Plugin, ButtonView, IconImageAssetManager } from 'ckeditor5';

export default class FileManager extends Plugin {
  init() {
    const editor = this.editor;
    const openFileManager: any = editor.config.get('openFileManager'); // Get function from config

    editor.ui.componentFactory.add('fileManager', (locale) => {
      const button = new ButtonView(locale);

      button.set({
        label: editor.t('Insert with file manager'),
        icon: IconImageAssetManager,
        tooltip: true
      });

      button.on('execute', async () => {
        const imageUrl = await openFileManager(); // Open modal and wait for selection

        if (imageUrl) {
          const splitUrl = imageUrl.split('/');

          editor.model.change((writer) => {
            // Check if `imageBlock` is available
            if (editor.model.schema.isRegistered('imageBlock')) {
              const imageElement = writer.createElement('imageBlock', {
                src: imageUrl,
                alt: splitUrl[splitUrl.length - 1]
              });

              editor.model.insertContent(imageElement, editor.model.document.selection);
            } else {
              console.error('imageBlock schema is not registered in CKEditor.');
            }
          });
        }
      });

      return button;
    });
  }
}

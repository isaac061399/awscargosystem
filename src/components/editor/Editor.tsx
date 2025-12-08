'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { type EventInfo, type EditorConfig, ClassicEditor } from 'ckeditor5';
import esTranslations from 'ckeditor5/translations/es.js';
import enTranslations from 'ckeditor5/translations/en.js';

import getEditorConfig from './EditorConfig';
import MediaLibrarySelector from '@components/media-selector/MediaLibrarySelector';

import i18nConfigApp from '@/configs/i18nConfigApp';

import 'ckeditor5/ckeditor5.css';

export type EditorProps = {
  locale: string;
  id?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: EventInfo<string, unknown>, editor: ClassicEditor) => void;
  disabled?: boolean;
  fileManager?: { title: string; canAdd: boolean; canDelete: boolean };
};

const translations: any = { es: esTranslations, en: enTranslations };

const Editor = ({ locale, id, placeholder, value, onChange, disabled, fileManager }: EditorProps) => {
  const editorContainerRef = useRef(null);
  const editorRef = useRef(null);

  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [fileManagerResolver, setFileManagerResolver] = useState<any>(null);

  const translation = translations[locale] || translations[i18nConfigApp.defaultLocale];

  useEffect(() => {
    const setter = () => setIsLayoutReady(true);

    setter();
  }, []);

  const handleFileManagerOpen = () => {
    setFileManagerOpen(true);

    return new Promise((resolve) => {
      setFileManagerResolver(() => resolve);
    });
  };

  const handleFileManagerClose = () => {
    setFileManagerOpen(false);
    setFileManagerResolver(null);
  };

  const handleFileManagerSelect = (imageUrl: string) => {
    if (fileManagerResolver) {
      fileManagerResolver(imageUrl);
    }
  };

  const editorConfig: EditorConfig | undefined = useMemo(() => {
    if (!isLayoutReady) {
      return;
    }

    return getEditorConfig(translation, placeholder, handleFileManagerOpen);
  }, [isLayoutReady, translation, placeholder]);

  return (
    <div className="editor-container editor-container_classic-editor" ref={editorContainerRef}>
      <div className="editor-container__editor">
        <div ref={editorRef}>
          {editorConfig && (
            <CKEditor
              editor={ClassicEditor}
              config={editorConfig}
              id={id}
              data={value}
              onChange={onChange}
              disabled={disabled}
            />
          )}
        </div>
      </div>

      {fileManagerOpen && (
        <Dialog open={true} onClose={handleFileManagerClose} fullWidth maxWidth="lg">
          <DialogContent>
            <MediaLibrarySelector
              title={fileManager?.title}
              canAdd={fileManager?.canAdd}
              canDelete={fileManager?.canDelete}
              onSelect={(media: any) => {
                handleFileManagerSelect(media.src);
                handleFileManagerClose();
              }}
              onCancel={handleFileManagerClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Editor;

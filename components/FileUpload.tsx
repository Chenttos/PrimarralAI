
import React from 'react';
import { Upload, X, Plus } from 'lucide-react';
import { StudyImage, Language } from '../types';

interface FileUploadProps {
  images: StudyImage[];
  onImagesChange: (images: StudyImage[]) => void;
  isDark?: boolean;
  lang: Language;
}

const translations = {
  pt: {
    click: "Clique para enviar",
    drag: "ou arraste fotos aqui",
    info: "PNG, JPG ou WEBP (até 10 imagens)",
    add: "Adicionar"
  },
  en: {
    click: "Click to upload",
    drag: "or drag photos here",
    info: "PNG, JPG or WEBP (up to 10 images)",
    add: "Add"
  }
};

const FileUpload: React.FC<FileUploadProps> = ({ images, onImagesChange, isDark, lang }) => {
  const t = translations[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onImagesChange([...images, {
          id: Math.random().toString(36).substr(2, 9),
          base64,
          mimeType: file.type,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <label className={`group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-300 hover:bg-slate-50 hover:border-indigo-400'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className={`p-4 rounded-full transition-all mb-4 ${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-indigo-50'}`}>
              <Upload className={`w-8 h-8 ${isDark ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'}`} />
            </div>
            <p className="mb-2 text-sm">
              <span className="font-semibold">{t.click}</span> {t.drag}
            </p>
            <p className="text-xs text-slate-500">{t.info}</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </label>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div key={img.id} className={`relative group aspect-square rounded-xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <img src={img.base64} alt={img.name} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(img.id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <label className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl transition-all cursor-pointer ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-300 text-slate-400 hover:bg-slate-100 hover:border-indigo-300'}`}>
            <Plus className="w-6 h-6" />
            <span className="text-xs mt-1">{t.add}</span>
            <input 
              type="file" 
              className="hidden" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

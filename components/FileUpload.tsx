
import React from 'react';
import { Upload, X, Plus, FileText, File as FileIcon } from 'lucide-react';
import { StudyFile, Language } from '../types';

interface FileUploadProps {
  files: StudyFile[];
  onFilesChange: (files: StudyFile[]) => void;
  isDark?: boolean;
  lang: Language;
}

const translations = {
  pt: {
    click: "Clique para enviar",
    drag: "ou arraste arquivos aqui",
    info: "Imagens ou PDF (até 10 arquivos)",
    add: "Adicionar"
  },
  en: {
    click: "Click to upload",
    drag: "or drag files here",
    info: "Images or PDF (up to 10 files)",
    add: "Add"
  }
};

const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesChange, isDark, lang }) => {
  const t = translations[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onFilesChange([...files, {
          id: Math.random().toString(36).substr(2, 9),
          base64,
          mimeType: file.type,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  };

  const isImage = (mime: string) => mime.startsWith('image/');

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <label className={`group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-300 hover:bg-slate-50 hover:border-indigo-400'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className={`p-4 rounded-full transition-all mb-4 ${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-indigo-50'}`}>
              <Upload className={`w-8 h-8 ${isDark ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'}`} />
            </div>
            <p className="mb-2 text-sm px-4 text-center">
              <span className="font-semibold">{t.click}</span> {t.drag}
            </p>
            <p className="text-xs text-slate-500">{t.info}</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/*,.pdf" 
            onChange={handleFileChange} 
          />
        </label>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <div key={file.id} className={`relative group aspect-square rounded-xl overflow-hidden border flex flex-col items-center justify-center p-2 transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              {isImage(file.mimeType) ? (
                <img src={file.base64} alt={file.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-center w-full h-full p-2 bg-indigo-500/5 rounded-lg">
                  <FileText className="w-10 h-10 text-indigo-500" />
                  <span className="text-[10px] font-bold truncate w-full px-2 text-slate-500">{file.name}</span>
                  <span className="text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase font-black">PDF</span>
                </div>
              )}
              <button 
                onClick={() => removeFile(file.id)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <label className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl transition-all cursor-pointer ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-300 text-slate-400 hover:bg-slate-100 hover:border-indigo-300'}`}>
            <Plus className="w-6 h-6" />
            <span className="text-xs mt-1 font-bold">{t.add}</span>
            <input 
              type="file" 
              className="hidden" 
              multiple 
              accept="image/*,.pdf" 
              onChange={handleFileChange} 
          />
          </label>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

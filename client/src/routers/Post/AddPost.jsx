import { useAddField } from "../../hooks/useAddField/useAddField";
import { useInputCheck } from "../../hooks/useInputCheck";
import { useAddPostMutation } from "../../app/api/apiSlice";
import { staticApi } from "../../static/static";
import { TasksHeader } from "../../forms/tasksHeader";
import { useEffect, useState } from "react";
import { TasksInputFields } from "../../auxСomponents/TasksInputFields";
import { docxCreator } from "../../../docx/docx_creator";

export const AddPost = () => {
  const [isSubmite, setSubmite] = useState(false);
  var s = staticApi();
  const [postObj] = useAddPostMutation();
  const { formData, handleChange, handleSubmit, setData } = useInputCheck();
  var { component, componentData, repeatControll, addField } = useAddField(
    s.structure.addPosition,
    TasksInputFields
  );
  
  useEffect(() => {
    setData(s.structure.addPost);
  }, []);

  useEffect(() => {
    isSubmite && handleSubmit(postObj);
  }, [isSubmite]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 mb-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Служебная записка
            </h1>
          </div>
          <TasksHeader />
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[70vh]">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-200 p-6 px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                Данные документа
              </h2>
            </div>
          </div>

          {/* Form Content - ВОТ ТУТ ТВОИ ПОЛЯ */}
          <div className="p-12 pb-8 space-y-8 overflow-y-auto max-h-[75vh]">
            <div className="space-y-6">
              {component}
            </div>
          </div>

          {/* Action Buttons - ВОССТАНОВЛЕНЫ ВСЕ КНОПКИ */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 p-6 px-8">
            <div className="flex flex-wrap gap-3 justify-end items-center max-w-4xl mx-auto">
              {/* repeatControll - твоя кнопка повторения */}
              {repeatControll}
              
              <div className="flex gap-3">
                {/* Кнопка добавить поле */}
                <button 
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 border border-emerald-400/50"
                  onClick={addField}
                >
                  ➕ Добавить поле
                </button>
                
                {/* Кнопка добавить пост */}
                <button
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 border border-indigo-400/50"
                  data-testid="AddPostSubmite"
                  onClick={() => {
                    docxCreator(componentData.formData);
                    handleChange({ about: JSON.stringify(componentData.formData) });
                    setSubmite(true);
                  }}
                >
                  Добавить пост
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
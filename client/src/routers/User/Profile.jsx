import { useGetCurrentUserQuery, useUpdateCurrentUserMutation } from '../../app/api/apiSlice';
import { useState } from 'react';

export const Profile = () => {
  const { data: user } = useGetCurrentUserQuery();
  const [updateUser] = useUpdateCurrentUserMutation();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');

  if (!user) return <div>Загрузка...</div>;

  const handleSave = async () => {
    await updateUser({ full_name: fullName }).unwrap();
    setEditing(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Профиль</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Логин:</label>
          <p className="text-lg">{user.username}</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Полное имя:</label>
          {editing ? (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          ) : (
            <p className="text-lg">{user.full_name}</p>
          )}
        </div>
        {editing ? (
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-6 py-2 bg-black text-white rounded-lg">
              Сохранить
            </button>
            <button onClick={() => { setEditing(false); setFullName(user.full_name); }} className="px-6 py-2 bg-gray-200 rounded-lg">
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditing(true); setFullName(user.full_name); }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Редактировать
          </button>
        )}
      </div>
    </div>
  );
};
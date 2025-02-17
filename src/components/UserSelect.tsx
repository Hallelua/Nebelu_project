import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getGravatarUrl } from '../lib/utils';

type User = {
  id: string;
  email: string;
};

type Props = {
  value: string[];
  onChange: (users: string[]) => void;
};

export function UserSelect({ value, onChange }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('auth.users')
          .select('id, email')
          .ilike('email', `%${search}%`)
          .limit(5);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    if (search) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [search]);

  const handleSelect = (userId: string) => {
    if (!value.includes(userId)) {
      onChange([...value, userId]);
    }
    setSearch('');
  };

  const handleRemove = (userId: string) => {
    onChange(value.filter(id => id !== userId));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(userId => (
          <div
            key={userId}
            className="flex items-center bg-gray-100 rounded-full px-3 py-1"
          >
            <span className="text-sm text-gray-700">{userId}</span>
            <button
              type="button"
              onClick={() => handleRemove(userId)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          placeholder="Search users by email..."
        />
        {loading && (
          <div className="absolute right-2 top-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        )}
        {users.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg">
            <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {users.map((user) => (
                <li
                  key={user.id}
                  onClick={() => handleSelect(user.id)}
                  className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                >
                  <div className="flex items-center">
                    <img
                      src={getGravatarUrl(user.email)}
                      alt={user.email}
                      className="h-6 w-6 rounded-full mr-2"
                    />
                    <span>{user.email}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
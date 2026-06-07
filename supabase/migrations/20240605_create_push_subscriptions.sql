create table push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  token text not null,
  created_at timestamp with time zone default now(),
  unique(user_id)
);

-- Online ordering. Prices are copied server-side from menu_items when an order is created.
create type order_status as enum ('pending','accepted','preparing','ready','out_for_delivery','delivered','cancelled');
create type order_type as enum ('delivery','takeaway');
create type payment_method as enum ('cod','upi');
create type payment_status as enum ('unpaid','pending','paid','failed');

alter table menu_items add column if not exists image_url text;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('HD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  order_type order_type not null,
  address text check (address is null or char_length(address) between 10 and 500),
  instructions text check (instructions is null or char_length(instructions) <= 500),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  total numeric(10,2) not null check (total = subtotal + delivery_fee),
  payment_method payment_method not null,
  payment_status payment_status not null default 'unpaid',
  payment_reference text,
  status order_status not null default 'pending'
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id) on delete restrict,
  item_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity int not null check (quantity between 1 and 50),
  line_total numeric(10,2) not null check (line_total = unit_price * quantity)
);

create index orders_status_created_idx on orders(status, created_at desc);
create index orders_phone_created_idx on orders(phone, created_at desc);
create trigger orders_upd before update on orders for each row execute function set_updated_at();

alter table orders enable row level security;
alter table order_items enable row level security;
create policy "admin orders" on orders for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin order items" on order_items for all to authenticated using (is_admin()) with check (is_admin());

insert into site_settings(key, value) values ('delivery_fee', '0') on conflict (key) do nothing;

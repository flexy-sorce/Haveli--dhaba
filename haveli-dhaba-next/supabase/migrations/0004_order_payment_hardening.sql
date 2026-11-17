-- Tie Razorpay signatures to the payment order created for this exact local order.
alter table orders add column if not exists razorpay_order_id text;
create unique index if not exists orders_razorpay_order_id_idx
  on orders(razorpay_order_id) where razorpay_order_id is not null;

alter table orders drop constraint if exists orders_delivery_address_check;
alter table orders add constraint orders_delivery_address_check
  check (order_type <> 'delivery' or (address is not null and char_length(address) between 10 and 500));

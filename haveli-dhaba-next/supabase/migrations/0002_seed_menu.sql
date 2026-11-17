-- Seeds menu names from the printed menus. Prices intentionally NULL until the owner confirms them.
insert into menu_categories(name,sort_order) values
('Jain Food Special',0),
('Dal',1),
('Veg',2),
('Paneer',3),
('Chicken',4),
('Mutton',5),
('Fish & Prawn',6),
('Starters',7),
('Tandoor Starters',8),
('Soup',9),
('Noodles',10),
('Rice & Pulao',11),
('Biryani',12),
('Breads',13),
('Breakfast',14),
('Dosa & South Indian',15),
('Raita & Salad',16),
('Desserts',17),
('Beverages',18)
on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Mix Veg',0),('Veg Jalfrezi',1),('Veg Navratna Korma',2),('Shahi Paneer',3),('Paneer Makhani',4),('Malai Kofta',5)) as v(n,o) where name='Jain Food Special' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Dal Fry',0),('Dal Makhani',1),('Dal Tadka',2),('Yellow Dal Butter Fry',3)) as v(n,o) where name='Dal' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Mix Veg',0),('Veg Kadai',1),('Veg Kolhapuri',2),('Aloo Gobi Bhujiya',3),('Chana Masala',4),('Mushroom Masala',5),('Kadhai Mushroom',6),('Baby Corn Masala',7)) as v(n,o) where name='Veg' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Paneer Masala',0),('Paneer Kadai',1),('Paneer Butter Masala',2),('Paneer Kolhapuri',3),('Paneer Lababdar',4),('Kaju Paneer',5),('Haveli Dhaba Paneer Spl.',6),('Palak Paneer',7),('Mattar Paneer',8),('Paneer Do Pyaza',9)) as v(n,o) where name='Paneer' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Chicken Curry',0),('Chicken Masala',1),('Chicken Kassa',2),('Kadai Chicken',3),('Chicken Handi',4),('Chicken Do Payaza',5),('Chicken Lababdar',6),('Chicken Butter Masala',7),('T.D. Chicken Punjabi',8),('Murg Musallam',9)) as v(n,o) where name='Chicken' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Mutton Curry',0),('Mutton Masala',1),('Mutton Kassa',2),('Mutton Keema Masala',3),('Mutton Rogan Josh',4)) as v(n,o) where name='Mutton' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Fish Fry',0),('Fish Curry',1),('Fish Sarso',2),('Fish Masala',3),('Prawn Curry',4),('Prawn Masala',5)) as v(n,o) where name='Fish & Prawn' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Paneer Chilly',0),('Chana Chilly',1),('Baby Corn Chilly',2),('Mushroom Chilly',3),('Veg Manchurian',4),('Chicken Chilly',5),('Chicken Lollipop',6),('Chicken 65',7),('French Fry',8)) as v(n,o) where name='Starters' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Paneer Tikka',0),('Paneer Malai Tikka',1),('Hara Bhara Kabab',2),('Veg Seek Kabab',3),('Chicken Tikka',4),('Chicken Malai Tikka',5),('Tandoori Chicken',6),('Abu Chilly Kabab',7),('Chicken Seek Kabab',8)) as v(n,o) where name='Tandoor Starters' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Hot & Sour',0),('Manchow',1),('Sweet Corn',2),('Tomato',3),('Lemon Coriander',4)) as v(n,o) where name='Soup' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Veg Hakka Noodles',0),('Egg Hakka Noodles',1),('Chicken Hakka Noodles',2),('Mix Hakka Noodles',3),('Veg Chopsy / Gravy Noodle',4)) as v(n,o) where name='Noodles' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Plain Rice',0),('Jeera Rice',1),('Peas Pulao',2),('Veg Pulao',3),('Kashmiri Pulao',4),('Veg Fried Rice',5),('Egg Fried Rice',6),('Chicken Fried Rice',7)) as v(n,o) where name='Rice & Pulao' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Veg Biryani',0),('Veg Hyderabadi Biryani',1),('Egg Biryani',2),('Chicken Biryani',3),('Mutton Biryani',4)) as v(n,o) where name='Biryani' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Tandoori Roti',0),('Naan Plain',1),('Naan Butter',2),('M/s Kulcha',3),('Paneer Kulcha',4),('Cheese Naan',5),('Garlic Naan',6),('Missi Roti',7),('Lachha Paratha',8),('Stuff Naan',9)) as v(n,o) where name='Breads' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Puri Sabji',0),('Cholla Bhatra',1),('Plain Paratha',2),('Sattu Paratha',3),('Paneer Paratha',4),('Aloo Paratha',5),('Onion Paratha',6),('Bread Butter',7),('Bread Omelet',8)) as v(n,o) where name='Breakfast' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Sada Dosa',0),('Masala Dosa',1),('Plain Rawa Dosa',2),('Plain Paneer Dosa',3),('Haveli Special Dosa',4),('Mysore Dosa',5),('Idli (2pcs)',6),('Sambar Vada (2pcs)',7),('Tomato Uttapam',8),('Mix Uttapam',9)) as v(n,o) where name='Dosa & South Indian' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Mix Raita',0),('Boondi Raita',1),('Potato Raita',2),('Plain Curd',3),('Onion Salad',4),('Green Salad',5)) as v(n,o) where name='Raita & Salad' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Hot Gulab Jamun (2pc)',0),('Hot Gulab Jamun with Ice Cream',1)) as v(n,o) where name='Desserts' on conflict do nothing;
insert into menu_items(category_id,name,sort_order) select id,v.n,v.o from menu_categories, (values ('Mineral Water',0),('Tea',1),('Coffee',2),('Lassi',3),('Fresh Lima Soda',4),('Fresh Lime Water',5),('Masala Cold Drinks',6),('Blue Lagoon',7)) as v(n,o) where name='Beverages' on conflict do nothing;

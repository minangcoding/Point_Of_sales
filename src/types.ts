export type Category = {
  id: string;
  name: string;
  code?: string;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  price: number;
  image_url?: string;
  created_at: string;
  categories?: Category; // for joined queries
};

export type Profile = {
  id: string;
  name: string;
  role: 'admin' | 'operator';
  created_at: string;
};

export type Transaction = {
  id: string;
  operator_id: string;
  total_amount: number;
  payment_method: 'cash' | 'qr';
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
  profiles?: Profile;
};

export type TransactionItem = {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  products?: Product;
};

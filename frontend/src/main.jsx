import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './home/Home';
import Login from './login/Login';
import Products from './products/Products';
import Signup from './signup/Signup';
import Cart from './cart/Cart';
import Checkout from './checkout/Checkout'; 
import { CartProvider } from './cart/CartContext';
import NotFound from './notFound/NotFound'; 

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/products',
    element: <Products />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/cart',
    element: <Cart />,
  },
  {
    path: '/checkout',
    element: <Checkout />, 
  },
  {
    path: '*',
    element: <NotFound />, 
  },
]);

const Root = () => (
  <CartProvider>
    <RouterProvider router={router} />
  </CartProvider>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
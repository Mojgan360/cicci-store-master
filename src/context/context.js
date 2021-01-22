import React, { Component } from "react";
import { linkData } from "../context/linkData";
import { socialData } from "../context/sosialData.js";
//import { items } from "./productData";
import { client } from "./contentful";

const ProductContext = React.createContext();

class ProductProvider extends Component {
  state = {
    sidebarOpen: false,
    cartOpen: false,
    cartItems: 0,
    link: linkData,
    socialDataIcon: socialData,
    cart: [],
    cartSubTotal: 0,
    cartTax: 0,
    cartTotal: 0,
    storeProducts: [],
    filteredProducts: [],
    featuredProducts: [],
    singleProduct: {},
    loading: true,
    search: "",
    price: 0,
    min: 0,
    max: 0,
    company: "all",
    shipping: false
  };
  componentDidMount() {
    // this.setProducts(items);
    client
      .getEntries({
        content_type: "cicciShop"
      })
      .then(response => this.setProducts(response.items))
      .catch(console.error);
  }

  //set Products
  setProducts = products => {
    const storeProducts = products.map(item => {
      const { id } = item.sys;
      const image = item.fields.image.fields.file.url;
      const product = { id, ...item.fields, image };
      return product;
    });
    let featuredProducts = storeProducts.filter(item => item.featured === true);

    let maxPrice = Math.max(...storeProducts.map(item => item.price));
    this.setState(
      {
        storeProducts,
        filteredProducts: storeProducts,
        featuredProducts,
        cart: this.getStorageCart(),
        singleProduct: this.getStorageProduct(),
        loading: false,
        price: maxPrice,
        max: maxPrice
      },
      () => {
        this.addTotals();
      }
    );
  };

  getStorageCart = () => {
    // return [];
    let cart;
    if (localStorage.getItem("cart")) {
      cart = JSON.parse(localStorage.getItem("cart"));
    } else {
      cart = [];
    }
    return cart;
  };

  getStorageProduct = () => {
    return localStorage.getItem("singleProduct")
      ? JSON.parse(localStorage.getItem("singleProduct"))
      : {};
  };

  syncStorage = () => {
    localStorage.setItem("cart", JSON.stringify(this.state.cart));
  };

  setSingleProduct = id => {
    let product = this.state.storeProducts.find(item => item.id === id);
    // console.log(product);
    localStorage.setItem("singleProduct", JSON.stringify(product));
    this.setState({
      singleProduct: { ...product },
      loading: false
    });
  };
  // handle sidebar
  handleSidebar = () => {
    this.setState({ sidebarOpen: !this.state.sidebarOpen });
  };

  // hanldle cart
  handleCart = () => {
    this.setState({ cartOpen: !this.state.cartOpen });
  };
  //close cart
  handlecloseCart = () => {
    this.setState({ cartOpen: false });
  };
  // open
  handleOpenCart = () => {
    this.setState({ cartOpen: true });
  };

  // getTotals
  getTotals = () => {
    //the value of everything that's in a cart without actual tax.
    let subTotal = 0;
    //value of cart items
    let cartItems = 0;

    this.state.cart.forEach(item => {
      subTotal += item.total;
      cartItems += item.count;
    });

    subTotal = parseFloat(subTotal.toFixed(2));
    let tax = subTotal * 0.1;
    tax = parseFloat(tax.toFixed(2));
    let total = subTotal + tax;
    total = parseFloat(total.toFixed(2));

    return {
      cartItems,
      tax,
      subTotal,
      total
    };
  };
  // addTotals
  addTotals = () => {
    //skapa ny variable_ totals
    const totals = this.getTotals();
    this.setState(() => {
      return {
        cartItems: totals.cartItems,
        cartSubTotal: totals.subTotal,
        cartTax: totals.tax,
        cartTotal: totals.total
      };
    });
  };

  addToCart = id => {
    let tempCart = [...this.state.cart];
    let tempProducts = [...this.state.storeProducts];
    let tempItem = tempCart.find(item => item.id === id);
    if (!tempItem) {
      tempItem = tempProducts.find(item => item.id === id);

      let total = tempItem.price;

      let cartItem = { ...tempItem, count: 1, total };

      tempCart = [...tempCart, cartItem];
    } else {
      tempItem.count++;
      tempItem.total = tempItem.price * tempItem.count;
      tempItem.total = parseFloat(tempItem.total.toFixed(2));
    }
    // console.log(tempCart);
    this.setState(
      () => {
        return { cart: tempCart };
      },
      () => {
        this.addTotals();
        this.syncStorage();
        this.handleOpenCart();
      }
    );
  };
  //cart fonctionally
  //increment
  increment = id => {
    const tempCart = [...this.state.cart];
    const cartItem = tempCart.find(item => item.id === id);
    cartItem.count++;
    cartItem.total = cartItem.count * cartItem.price;
    cartItem.total = parseFloat(cartItem.total.toFixed(2));
    this.setState(
      () => {
        return {
          cart: [...tempCart]
        };
      },
      () => {
        this.addTotals();
        this.syncStorage();
      }
    );
  };

  decrement = id => {
    const tempCart = [...this.state.cart];
    const cartItem = tempCart.find(item => item.id === id);
    cartItem.count = cartItem.count - 1;
    if (cartItem.count === 0) {
      this.removeItem(id);
      console.log("count is noll");
    } else {
      cartItem.total = cartItem.count * cartItem.price;
      cartItem.total = parseFloat(cartItem.total.toFixed(2));

      this.setState(
        () => {
          return {
            cart: [...tempCart]
          };
        },
        () => {
          this.addTotals();
          this.syncStorage();
        }
      );
    }
  };
  //remove item
  removeItem = id => {
    let tempCart = [...this.state.cart];
    tempCart = tempCart.filter(item => item.id !== id);
    this.setState(
      {
        cart: [...tempCart]
      },
      () => {
        this.addTotals();
        this.syncStorage();
      }
    );
  };
  //clear
  clearCart = () => {
    this.setState(
      {
        cart: []
      },
      () => {
        this.addTotals();
        this.syncStorage();
      }
    );
  };

  handleChange = event => {
    const name = event.target.name;
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    //this.setState(
    this.setState(
      {
        [name]: value
      },
      this.sortData
    );
  };

  sortData = () => {
    const { storeProducts, company, shipping, search, price } = this.state;
    console.log("sorting data.....");
    let tempProducts = [...storeProducts];
    // price sort
    let tempPrice = parseInt(price);

    tempProducts = tempProducts.filter(item => item.price <= tempPrice);

    // company sort
    if (company !== "all") {
      tempProducts = tempProducts.filter(item => item.company === company);
    }
    //shipping sort
    if (shipping) {
      tempProducts = tempProducts.filter(item => item.freeShipping === true);
    }
    //search sort
    if (search.length > 0) {
      tempProducts = tempProducts.filter(item => {
        let tempSearch = search.toLowerCase();
        let tempTitle = item.title.toLowerCase().slice(0, search.length);
        if (tempSearch === tempTitle) {
          return item;
        }
        return item;
      });
    }
    this.setState({
      filteredProducts: tempProducts
    });
    console.log(tempProducts);
  };

  render() {
    return (
      <ProductContext.Provider
        value={{
          ...this.state,
          handleSidebar: this.handleSidebar,
          handleCart: this.handleCart,
          handlecloseCart: this.handlecloseCart,
          handleOpenCart: this.handleOpenCart,
          setSingleProduct: this.setSingleProduct,
          addToCart: this.addToCart,
          increment: this.increment,
          decrement: this.decrement,
          removeItem: this.removeItem,
          clearCart: this.clearCart,
          handleChange: this.handleChange
        }}
      >
        {this.props.children}
      </ProductContext.Provider>
    );
  }
}

const ProductConsumer = ProductContext.Consumer;

export { ProductProvider, ProductConsumer };

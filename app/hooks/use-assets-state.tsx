import { create } from "zustand";
import type { Manufacturer, Product, ProductCategory } from "~/lib/models";
import { dedupById } from "~/lib/utils";

interface ProductFilterOptions {
  productFilter?: (product: Product) => boolean;
}

interface AssetsState {
  products: Promise<Product[]>;
  setProducts: (products: Product[]) => void;
  getProducts: (options?: ProductFilterOptions) => Promise<Product[]>;
  getProductCategories: (
    options?: ProductFilterOptions
  ) => Promise<ProductCategory[]>;
  getManufacturers: (options?: ProductFilterOptions) => Promise<Manufacturer[]>;
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export const useAssetsState = create<AssetsState>((set, get) => {
  const deferredProducts = createDeferred<Product[]>();

  const getProducts = ({
    productFilter = () => true,
  }: ProductFilterOptions = {}) =>
    get().products.then((products) => products.filter(productFilter));

  return {
    products: deferredProducts.promise,
    setProducts: (products) => deferredProducts.resolve(products),
    getProducts,
    getProductCategories: (options?: ProductFilterOptions) =>
      getProducts(options).then((products) =>
        dedupById(products.map((p) => p.productCategory))
      ),
    getManufacturers: (options?: ProductFilterOptions) =>
      getProducts(options).then((products) =>
        dedupById(products.map((p) => p.manufacturer))
      ),
  };
});

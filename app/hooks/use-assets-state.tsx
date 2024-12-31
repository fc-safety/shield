import { create } from "zustand";
import type { Manufacturer, Product, ProductCategory } from "~/lib/models";
import { dedupById } from "~/lib/utils";

interface ProductFilterOptions {
  productFilter?: (product: Product) => boolean;
}

interface AssetsState {
  products: Promise<Product[]>;
  setProducts: (products: Promise<Product[]>) => void;
  getProducts: (options?: ProductFilterOptions) => Promise<Product[]>;
  getProductCategories: (
    options?: ProductFilterOptions
  ) => Promise<ProductCategory[]>;
  getManufacturers: (options?: ProductFilterOptions) => Promise<Manufacturer[]>;
}

export const useAssetsState = create<AssetsState>((set, get) => {
  const getProducts = ({
    productFilter = () => true,
  }: ProductFilterOptions = {}) =>
    get().products.then((products) => products.filter(productFilter));

  return {
    products: Promise.resolve([]),
    setProducts: (products) => set({ products }),
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

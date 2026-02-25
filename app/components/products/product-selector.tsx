import DataList from "@/components/data-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, Search } from "lucide-react";
import type React from "react";
import { Suspense, useCallback, useEffect, useMemo, useState, type ComponentProps } from "react";
import { Await } from "react-router";
import { useImmer } from "use-immer";
import { create } from "zustand";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { useBlurOnClose } from "~/hooks/use-blur-on-close";
import { useProxyImage } from "~/hooks/use-proxy-image";
import type { Manufacturer, Product, ProductCategory } from "~/lib/models";
import { getProductsQuery } from "~/lib/services/products.service";
import { cn, dedupById } from "~/lib/utils";
import { ManufacturerCard } from "./manufacturer-selector";
import ProductCard from "./product-card";
import { ProductCategoryCard } from "./product-category-selector";

interface ProductSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  readOnly?: boolean;
  clientId?: string;
}

interface StepsState {
  step: number;
  maxStep: number;
  minStep: number;
  stepDirection: "forward" | "backward" | "none";
  stepForward: () => void;
  stepBackward: () => void;
  getCanStepForward: () => boolean;
  getCanStepBackward: () => boolean;
  reset: () => void;
}

const createUseSteps = (options: { maxStep: number; defaultStep?: number; minStep?: number }) => {
  return create<StepsState>((set, get) => ({
    step: options.defaultStep ?? 0,
    maxStep: options.maxStep,
    minStep: options.minStep ?? 0,
    stepDirection: "none",
    stepForward: () =>
      set((state) => ({
        step: Math.min(state.maxStep, state.step + 1),
        stepDirection: "forward",
      })),
    stepBackward: () =>
      set((state) => ({
        step: Math.max(state.minStep, state.step - 1),
        stepDirection: "backward",
      })),
    getCanStepForward: () => get().step < get().maxStep,
    getCanStepBackward: () => get().step > get().minStep,
    reset: () => set({ step: options.defaultStep ?? 0, stepDirection: "none" }),
  }));
};

const useSteps = createUseSteps({ maxStep: 3 });

interface Selections {
  productCategoryId?: string;
  manufacturerId?: string;
  productId?: string;
}
const DEFAULT_SELECTIONS = {
  productCategoryId: undefined,
  manufacturerId: undefined,
  productId: undefined,
} satisfies Selections;

interface ProductSelectStep {
  idx: number;
  step: React.ReactNode;
  canStepForward: boolean;
  nextText?: string;
  nextAction?: () => void;
}

export default function ProductSelector({
  value,
  onValueChange,
  onBlur,
  disabled = false,
  className,
  readOnly = false,
  clientId,
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false);

  const { fetchOrThrow } = useAuthenticatedFetch();
  const { data: products } = useSuspenseQuery(
    getProductsQuery(fetchOrThrow, { clientId })
  );

  const {
    step,
    stepDirection,
    minStep,
    maxStep,
    stepForward,
    stepBackward,
    getCanStepForward,
    getCanStepBackward,
    reset: resetStep,
  } = useSteps();

  const defaultProduct = useMemo(() => products.find((p) => p.id === value), [products, value]);
  const defaultSelected = useMemo(
    () =>
      defaultProduct
        ? {
            productCategoryId: defaultProduct.productCategory.id,
            manufacturerId: defaultProduct.manufacturer.id,
            productId: defaultProduct.id,
          }
        : DEFAULT_SELECTIONS,
    [defaultProduct]
  );
  const [selected, setSelected] = useImmer<Selections>(DEFAULT_SELECTIONS);

  const productCategories = useMemo(
    () => dedupById(products.map((p) => p.productCategory)),
    [products]
  );
  const manufacturers = useMemo(
    () =>
      dedupById(
        products
          .filter(
            (p) =>
              !selected.productCategoryId || p.productCategory.id === selected.productCategoryId
          )
          .map((p) => p.manufacturer)
      ),
    [products, selected.productCategoryId]
  );
  const narrowedProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          (!selected.productCategoryId || p.productCategory.id === selected.productCategoryId) &&
          (!selected.manufacturerId || p.manufacturer.id === selected.manufacturerId)
      ),
    [products, selected.productCategoryId, selected.manufacturerId]
  );

  const handleReset = useCallback(() => {
    setSelected(defaultSelected);
    resetStep();
  }, [resetStep, setSelected, defaultSelected]);

  useEffect(() => {
    open && handleReset();
  }, [open, handleReset]);

  useBlurOnClose({
    onBlur,
    open,
  });

  const steps: ProductSelectStep[] = useMemo(
    () => [
      {
        idx: 0,
        step: (
          <StepSelectProductCategory
            key="step0"
            productCategoryId={selected.productCategoryId}
            setProductCategoryId={(id) => {
              setSelected((draft) => {
                draft.productCategoryId = id;
                draft.manufacturerId = undefined;
                draft.productId = undefined;
              });
              stepForward();
            }}
            productCategories={productCategories}
          />
        ),
        canStepForward: !!selected.productCategoryId,
      },
      {
        idx: 1,
        step: (
          <StepSelectManufacturer
            key="step1"
            manufacturerId={selected.manufacturerId}
            setManufacturerId={(id) => {
              setSelected((draft) => {
                draft.manufacturerId = id;
                draft.productId = undefined;
              });
              stepForward();
            }}
            manufacturers={manufacturers}
          />
        ),
        canStepForward: !!selected.manufacturerId,
      },
      {
        idx: 2,
        step: (
          <StepSelectProduct
            key="step2"
            productId={selected.productId}
            setProductId={(id) => {
              setSelected((draft) => {
                draft.productId = id;
              });
              stepForward();
            }}
            products={narrowedProducts}
          />
        ),
        canStepForward: !!selected.productId,
        nextText: "Review",
      },
      {
        idx: 3,
        step: (
          <StepReview key="step3" product={products?.find((p) => p.id === selected.productId)} />
        ),
        canStepForward: true,
        nextText: "Finish",
        nextAction: () => {
          if (onValueChange && selected.productId) {
            onValueChange(selected.productId);
          }
          setOpen(false);
        },
      },
    ],
    [
      selected.productCategoryId,
      selected.manufacturerId,
      selected.productId,
      productCategories,
      manufacturers,
      narrowedProducts,
      products,
      setSelected,
      onValueChange,
    ]
  );

  const currentStep = useMemo(() => steps.find((s) => s.idx === step), [steps, step]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {value ? (
        <ProductCardWithOptimizedImage
          product={defaultProduct}
          renderEditButton={() =>
            readOnly ? null : (
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" disabled={disabled}>
                  <Pencil />
                </Button>
              </DialogTrigger>
            )
          }
        />
      ) : (
        <DialogTrigger asChild>
          <Button type="button" size="sm" disabled={disabled || readOnly} className={cn(className)}>
            <Search />
            Find Product
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="px-0">
        <DialogHeader className="px-6">
          <DialogTitle>Find Product</DialogTitle>
        </DialogHeader>
        <div className="w-full px-6">
          <Progress value={Math.round((step / (maxStep - minStep)) * 100)} className="w-full" />
        </div>
        <ScrollArea
          classNames={{
            root: "h-96 border-b border-t self-stretch",
          }}
        >
          {currentStep && (
            <div className="relative h-max w-full">
              <AnimatePresence custom={stepDirection}>
                <motion.div
                  key={currentStep.idx}
                  className="absolute top-0 right-0 left-0 h-max px-6"
                  custom={stepDirection}
                  variants={{
                    slideIn: (direction: typeof stepDirection) => ({
                      opacity: 0,
                      translateX:
                        direction === "forward"
                          ? "100%"
                          : direction === "backward"
                            ? "-100%"
                            : "0%",
                    }),
                    slideOut: (direction: typeof stepDirection) => ({
                      opacity: 0,
                      translateX: direction === "backward" ? "100%" : "-100%",
                    }),
                  }}
                  initial="slideIn"
                  animate={{
                    opacity: 1,
                    translateX: "0%",
                  }}
                  exit="slideOut"
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 26,
                  }}
                >
                  {currentStep.step}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-between px-6">
          <Button
            onClick={stepBackward}
            className={cn(!getCanStepBackward() && "pointer-events-none opacity-0")}
          >
            Back
          </Button>
          <Button
            onClick={currentStep?.nextAction ?? stepForward}
            disabled={
              (!currentStep?.nextAction && !getCanStepForward()) || !currentStep?.canStepForward
            }
          >
            {currentStep?.nextText ?? "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StepSelectProductCategoryProps {
  productCategoryId?: string;
  setProductCategoryId: (productCategoryId: string) => void;
  productCategories: ProductCategory[];
}

function StepSelectProductCategory({
  productCategoryId,
  setProductCategoryId,
  productCategories,
}: StepSelectProductCategoryProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <h3 className="text-normal font-regular">Select Category</h3>
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <Await resolve={productCategories}>
          {(value) => (
            <RadioGroup
              defaultValue="card"
              className="grid grid-cols-2 gap-4"
              onValueChange={setProductCategoryId}
              value={productCategoryId ?? ""}
            >
              {value
                .filter((c) => c.active || c.id === productCategoryId)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((productCategory) => (
                  <div key={productCategory.id}>
                    <RadioGroupItem
                      value={productCategory.id}
                      id={productCategory.id}
                      className="peer sr-only"
                      disabled={!productCategory.active}
                    />
                    <Label
                      htmlFor={productCategory.id}
                      className="border-muted peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary block h-full overflow-hidden rounded-md border-2 font-semibold"
                    >
                      <ProductCategoryCard
                        productCategory={productCategory}
                        className="bg-popover hover:bg-accent hover:text-accent-foreground h-full w-full rounded-none border-none"
                      />
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

interface StepSelectManufacturerProps {
  productCategoryId?: string;
  manufacturerId?: string;
  setManufacturerId: (manufacturerId: string) => void;
  manufacturers: Manufacturer[];
}

function StepSelectManufacturer({
  manufacturerId,
  setManufacturerId,
  manufacturers,
}: StepSelectManufacturerProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <h3 className="text-normal font-regular">Select Manufacturer</h3>
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <Await resolve={manufacturers}>
          {(value) => (
            <RadioGroup
              defaultValue="card"
              className="grid grid-cols-2 gap-4 py-2"
              onValueChange={setManufacturerId}
              value={manufacturerId ?? ""}
            >
              {value
                .filter((m) => m.active || m.id === manufacturerId)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((manufacturer) => (
                  <div key={manufacturer.id}>
                    <RadioGroupItem
                      value={manufacturer.id}
                      id={manufacturer.id}
                      className="peer sr-only"
                      disabled={!manufacturer.active}
                    />
                    <Label
                      htmlFor={manufacturer.id}
                      className="border-muted peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary block h-full overflow-hidden rounded-md border-2 font-semibold"
                    >
                      <ManufacturerCard
                        manufacturer={manufacturer}
                        className="bg-popover hover:bg-accent hover:text-accent-foreground h-full w-full rounded-none border-none"
                      />
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

interface StepSelectProductProps {
  productId?: string;
  setProductId: (manufacturerId: string) => void;
  products: Product[];
}

function StepSelectProduct({ productId, setProductId, products }: StepSelectProductProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <h3 className="text-normal font-regular">Select Product</h3>
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <Await resolve={products}>
          {(value) => (
            <RadioGroup
              defaultValue="card"
              className="grid gap-4"
              onValueChange={setProductId}
              value={productId ?? ""}
            >
              {value
                .filter((p) => p.active || p.id === productId)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((product) => (
                  <div key={product.id}>
                    <RadioGroupItem
                      value={product.id}
                      id={product.id}
                      className="peer sr-only"
                      disabled={!product.active}
                    />
                    <Label
                      htmlFor={product.id}
                      className="border-muted peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary block h-full overflow-hidden rounded-xl border-2 font-semibold"
                    >
                      <ProductCardWithOptimizedImage
                        product={product}
                        className="h-full w-full rounded-none border-none transition-opacity hover:opacity-80"
                      />
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function ProductCardWithOptimizedImage(
  props: Omit<ComponentProps<typeof ProductCard>, "optimizedImageUrl">
) {
  if (!props.product?.imageUrl) {
    return <ProductCard {...props} />;
  }

  const { proxyImageUrl: optimizedImageUrl } = useProxyImage({
    src: props.product.imageUrl,
    pre: "square",
    size: "160",
  });
  return <ProductCard {...props} optimizedImageUrl={optimizedImageUrl} />;
}

function StepReview({ product }: { product: Product | undefined }) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <h3 className="text-normal font-regular">Review</h3>
      <DataList
        details={[
          { label: "Product", value: product?.name },
          {
            label: "Description",
            value: product?.description ?? <>&mdash;</>,
          },
          { label: "Manufacturer", value: product?.manufacturer.name },
          { label: "Category", value: product?.productCategory.name },
        ]}
      />
    </div>
  );
}

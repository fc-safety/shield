import DataList from "@/components/data-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Pencil, Search } from "lucide-react";
import type React from "react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Await } from "react-router";
import { useImmer } from "use-immer";
import { create } from "zustand";
import { useAssetsState } from "~/hooks/use-assets-state";
import type { Product } from "~/lib/models";
import { cn } from "~/lib/utils";

interface ProductSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

interface StepsState {
  step: number;
  maxStep: number;
  minStep: number;
  stepForward: () => void;
  stepBackward: () => void;
  getCanStepForward: () => boolean;
  getCanStepBackward: () => boolean;
  reset: () => void;
}

const createUseSteps = (options: {
  maxStep: number;
  defaultStep?: number;
  minStep?: number;
}) => {
  return create<StepsState>((set, get) => ({
    step: options.defaultStep ?? 0,
    maxStep: options.maxStep,
    minStep: options.minStep ?? 0,
    stepForward: () =>
      set((state) => ({ step: Math.min(state.maxStep, state.step + 1) })),
    stepBackward: () =>
      set((state) => ({ step: Math.max(state.minStep, state.step - 1) })),
    getCanStepForward: () => get().step < get().maxStep,
    getCanStepBackward: () => get().step > get().minStep,
    reset: () => set({ step: options.defaultStep ?? 0 }),
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

export default function ProductSelector(props: ProductSelectorProps) {
  const { getProducts } = useAssetsState();

  const [products, setProducts] = useState<Product[] | null>(null);
  useEffect(() => {
    getProducts().then(setProducts);
  }, [getProducts]);
  return products ? (
    <ProductSelectorRoot {...props} products={products} />
  ) : (
    <Loader2 className="animate-spin" />
  );
}

function ProductSelectorRoot({
  value,
  onValueChange,
  disabled = false,
  className,
  products,
}: ProductSelectorProps & { products: Product[] }) {
  const [open, setOpen] = useState(false);

  const {
    step,
    minStep,
    maxStep,
    stepForward,
    stepBackward,
    getCanStepForward,
    getCanStepBackward,
    reset: resetStep,
  } = useSteps();

  const defaultProduct = useMemo(
    () => (value && products.find((p) => p.id === value)) ?? null,
    [products, value]
  );
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

  const handleReset = useCallback(() => {
    setSelected(defaultSelected);
    resetStep();
  }, [resetStep, setSelected, defaultSelected]);

  useEffect(() => {
    open && handleReset();
  }, [open, handleReset]);

  const steps: ProductSelectStep[] = useMemo(
    () => [
      {
        idx: 0,
        step: (
          <StepSelectProductCategory
            key="step0"
            productCategoryId={selected.productCategoryId}
            setProductCategoryId={(id) =>
              setSelected((draft) => {
                draft.productCategoryId = id;
                draft.manufacturerId = undefined;
                draft.productId = undefined;
              })
            }
          />
        ),
        canStepForward: !!selected.productCategoryId,
      },
      {
        idx: 1,
        step: (
          <StepSelectManufacturer
            key="step1"
            productCategoryId={selected.productCategoryId}
            manufacturerId={selected.manufacturerId}
            setManufacturerId={(id) =>
              setSelected((draft) => {
                draft.manufacturerId = id;
                draft.productId = undefined;
              })
            }
          />
        ),
        canStepForward: !!selected.manufacturerId,
      },
      {
        idx: 2,
        step: (
          <StepSelectProduct
            key="step2"
            {...selected}
            setProductId={(id) =>
              setSelected((draft) => {
                draft.productId = id;
              })
            }
          />
        ),
        canStepForward: !!selected.productId,
        nextText: "Review",
      },
      {
        idx: 3,
        step: <StepReview key="step3" productId={selected.productId} />,
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
    [selected, setSelected, onValueChange]
  );

  const currentStep = useMemo(
    () => steps.find((s) => s.idx === step),
    [steps, step]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="grid gap-2">
        {defaultProduct ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="grid gap-2">
                  <span>
                    <span className="text-xs text-muted-foreground">
                      {defaultProduct.manufacturer.name}
                    </span>
                  </span>
                  <span>
                    {defaultProduct.name}
                    <Badge
                      className="text-xs uppercase w-max ml-2"
                      variant="secondary"
                    >
                      {defaultProduct.productCategory.shortName ??
                        defaultProduct.productCategory.name}
                    </Badge>
                  </span>
                </div>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className={cn(className)}
                  >
                    <Pencil />
                  </Button>
                </DialogTrigger>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{defaultProduct.description ?? <>&mdash;</>}</p>
            </CardContent>
          </Card>
        ) : (
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              disabled={disabled}
              className={cn(className)}
            >
              <Search />
              Find Product
            </Button>
          </DialogTrigger>
        )}
      </div>
      <DialogContent className="px-0">
        <DialogHeader className="px-6">
          <DialogTitle>Find Product</DialogTitle>
        </DialogHeader>
        <div className="w-full px-6">
          <Progress
            value={Math.round((step / (maxStep - minStep)) * 100)}
            className="w-full"
          />
        </div>
        <ScrollArea className="h-96 border-b border-t px-6 self-stretch">
          {currentStep?.step}
        </ScrollArea>
        <div className="flex justify-between px-6">
          <Button
            onClick={stepBackward}
            className={cn(
              !getCanStepBackward() && "opacity-0 pointer-events-none"
            )}
          >
            Back
          </Button>
          <Button
            onClick={currentStep?.nextAction ?? stepForward}
            disabled={
              (!currentStep?.nextAction && !getCanStepForward()) ||
              !currentStep?.canStepForward
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
}

function StepSelectProductCategory({
  productCategoryId,
  setProductCategoryId,
}: StepSelectProductCategoryProps) {
  const { getProductCategories } = useAssetsState();
  const productCategories = useMemo(
    () => getProductCategories(),
    [getProductCategories]
  );

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
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((productCategory) => (
                  <div key={productCategory.id}>
                    <RadioGroupItem
                      value={productCategory.id}
                      id={productCategory.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={productCategory.id}
                      className="font-semibold h-full flex flex-col gap-2 items-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      {productCategory.shortName && (
                        <span className="uppercase">
                          {productCategory.shortName}
                        </span>
                      )}
                      <span className="font-regular text-xs text-center">
                        {productCategory.name}
                      </span>
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
}

function StepSelectManufacturer({
  productCategoryId,
  manufacturerId,
  setManufacturerId,
}: StepSelectManufacturerProps) {
  const { getManufacturers } = useAssetsState();
  const manufacturers = useMemo(
    () =>
      getManufacturers({
        productFilter: (product) =>
          !productCategoryId ||
          product.productCategory.id === productCategoryId,
      }),
    [getManufacturers, productCategoryId]
  );

  return (
    <div className="flex flex-col gap-4 py-2">
      <h3 className="text-normal font-regular">Select Manufacturer</h3>
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <Await resolve={manufacturers}>
          {(value) => (
            <RadioGroup
              defaultValue="card"
              className="grid grid-cols-2 gap-4"
              onValueChange={setManufacturerId}
              value={manufacturerId ?? ""}
            >
              {value
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((manufacturer) => (
                  <div key={manufacturer.id}>
                    <RadioGroupItem
                      value={manufacturer.id}
                      id={manufacturer.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={manufacturer.id}
                      className="font-semibold h-full flex flex-col gap-2 items-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      {manufacturer.name}
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
  productCategoryId?: string;
  manufacturerId?: string;
  productId?: string;
  setProductId: (manufacturerId: string) => void;
}

function StepSelectProduct({
  productCategoryId,
  manufacturerId,
  productId,
  setProductId,
}: StepSelectProductProps) {
  const { getProducts } = useAssetsState();
  const products = useMemo(
    () =>
      getProducts({
        productFilter: (product) =>
          (!productCategoryId ||
            product.productCategory.id === productCategoryId) &&
          (!manufacturerId || product.manufacturer.id === manufacturerId),
      }),
    [getProducts, productCategoryId, manufacturerId]
  );

  return (
    <div className="flex flex-col gap-4 py-2">
      <h3 className="text-normal font-regular">Select Product</h3>
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <Await resolve={products}>
          {(value) => (
            <RadioGroup
              defaultValue="card"
              className="grid grid-cols-2 gap-4"
              onValueChange={setProductId}
              value={productId ?? ""}
            >
              {value
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((product) => (
                  <div key={product.id}>
                    <RadioGroupItem
                      value={product.id}
                      id={product.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={product.id}
                      className="font-semibold text-center h-full flex flex-col gap-2 items-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      {product.name}
                      {product.description && (
                        <span className="font-light text-xs text-muted-foreground">
                          {product.description}
                        </span>
                      )}
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

function StepReview({ productId }: { productId: Product["id"] | undefined }) {
  const { getProducts } = useAssetsState();
  return (
    <div className="flex flex-col gap-4 py-2">
      <h3 className="text-normal font-regular">Review</h3>
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <Await resolve={getProducts()}>
          {(value) => {
            const product = value.find((p) => p.id === productId);
            return (
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
            );
          }}
        </Await>
      </Suspense>
    </div>
  );
}

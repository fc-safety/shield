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
import { Search } from "lucide-react";
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

export default function ProductSelector({
  value,
  onValueChange,
  disabled = false,
  className,
}: ProductSelectorProps) {
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

  const { getProducts } = useAssetsState();

  const [defaultProduct, setDefaultProduct] = useState<Product | null>(null);
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
  const [selected, setSelected] = useImmer<Selections>(defaultSelected);

  useEffect(() => {
    if (value) {
      getProducts().then((products) => {
        const product = products.find((p) => p.id === value);
        setDefaultProduct(product ?? null);
      });
    }
  });

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
        step: (
          <div>
            <h2>Review</h2>
            <pre>{JSON.stringify(selected, null, 2)}</pre>
          </div>
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
    [selected, setSelected, onValueChange]
  );

  const currentStep = useMemo(
    () => steps.find((s) => s.idx === step),
    [steps, step]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div>
        <span className="text-xs">
          Selected product: {defaultProduct?.name}
        </span>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            className={cn(className)}
          >
            <Search />
            Select Product
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find Product</DialogTitle>
        </DialogHeader>
        <Progress
          value={Math.round((step / (maxStep - minStep)) * 100)}
          className="w-full"
        />
        <ScrollArea className="h-96 w-[32rem] rounded-md -mx-6 px-6 self-stretch">
          {currentStep?.step}
        </ScrollArea>
        <div className="flex justify-between">
          <Button onClick={stepBackward} disabled={!getCanStepBackward()}>
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
    <div className="flex flex-col gap-4">
      <h3 className="text-normal font-regular">Select Category</h3>
      <Suspense fallback={<div>Loading...</div>}>
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
    <div className="flex flex-col gap-4">
      <h3 className="text-normal font-regular">Select Manufacturer</h3>
      <Suspense fallback={<div>Loading...</div>}>
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
    <div className="flex flex-col gap-4">
      <h3 className="text-normal font-regular">Select Product</h3>
      <Suspense fallback={<div>Loading...</div>}>
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

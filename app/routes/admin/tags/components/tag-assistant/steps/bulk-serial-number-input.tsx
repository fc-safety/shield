import { useMemo } from "react";
import GradientScrollArea from "~/components/gradient-scroll-area";
import HelpPopover from "~/components/help-popover";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollBar } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import Step from "../../../../../../components/assistant/components/step";
import { MAX_SERIAL_NUMBER_COUNT } from "../constants/core";
import { coerceNumeric, incrementSerialNumber } from "../utils/inputs";

export default function StepBulkSerialNumberInput({
  onStepBackward,
  onContinue,
  serialNumberMethod = "sequential",
  serialNumberRangeStart,
  serialNumberRangeEnd,
  serialNumbers,
  setSerialNumberMethod,
  setSerialNumberRangeStart,
  setSerialNumberRangeEnd,
  setSerialNumbers,
}: {
  onStepBackward: () => void;
  onContinue: () => void;
  serialNumberMethod: "sequential" | "manual";
  serialNumberRangeStart?: string;
  serialNumberRangeEnd?: string;
  serialNumbers?: string[];
  setSerialNumberMethod: (serialNumberMethod: "sequential" | "manual") => void;
  setSerialNumberRangeStart: (serialNumber: string) => void;
  setSerialNumberRangeEnd: (serialNumber: string) => void;
  setSerialNumbers: (serialNumbers: string[]) => void;
}) {
  const maxEndingSerialNumber = useMemo(
    () =>
      serialNumberRangeStart &&
      incrementSerialNumber(serialNumberRangeStart, MAX_SERIAL_NUMBER_COUNT - 1),
    [serialNumberRangeStart]
  );

  return (
    <Step
      title="Let's figure out which tag serial numbers to pre-program."
      subtitle="Choose a method."
      onStepBackward={onStepBackward}
      continueDisabled={
        (serialNumberMethod === "sequential" &&
          (!serialNumberRangeStart || !serialNumberRangeEnd)) ||
        (serialNumberMethod === "manual" && !serialNumbers?.length)
      }
      onContinue={onContinue}
    >
      <Tabs
        value={serialNumberMethod}
        onValueChange={(value) => setSerialNumberMethod(value as "sequential" | "manual")}
      >
        <TabsList className="grid w-full grid-cols-[1fr_1fr]">
          <TabsTrigger value="sequential" className="flex items-center gap-1">
            Sequential
            <HelpPopover>
              <div className="space-y-2">
                <p>
                  Generate a large set of serial numbers by providing a starting and ending serial
                  number. Serial numbers will be automatically generated to fill the range.
                </p>
                <p>
                  For example, if you enter 0000099 and 0001099, the serial numbers will be 0000099,
                  0000100, 0000101, ..., 0001099.
                </p>
              </div>
            </HelpPopover>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1">
            Manual
            <HelpPopover>Enter each serial number manually, one per line.</HelpPopover>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sequential" className="my-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div>
              <Label className="mb-2 block">Starting Serial Number</Label>
              <Input
                inputMode="numeric"
                placeholder="0000099"
                className="w-full"
                value={serialNumberRangeStart ?? ""}
                onChange={(e) => {
                  const newValue = coerceNumeric(e.target.value);
                  if (serialNumberRangeStart && serialNumberRangeEnd) {
                    const increment =
                      parseInt(serialNumberRangeEnd) - parseInt(serialNumberRangeStart);
                    setSerialNumberRangeEnd(incrementSerialNumber(newValue, increment));
                  }

                  setSerialNumberRangeStart(newValue);
                }}
              />
            </div>
            <div>
              <Label className="mb-2 block">Ending Serial Number</Label>
              <Input
                inputMode="numeric"
                placeholder="0001099"
                className="w-full"
                value={serialNumberRangeEnd ?? ""}
                onChange={(e) =>
                  setSerialNumberRangeEnd(
                    enforceMaxEndingSerialNumber(
                      maxEndingSerialNumber,
                      coerceNumeric(e.target.value)
                    )
                  )
                }
              />
            </div>
            <p className="text-muted-foreground col-span-full text-xs italic">
              Enter the start and end of a range of serial numbers to generate the whole range
              sequentially. Maximum: {MAX_SERIAL_NUMBER_COUNT.toLocaleString()} tags.
            </p>
          </div>
          <div className="w-full">
            <Label className="mb-2 flex items-center gap-1">
              Quick Increments
              <HelpPopover>
                <div className="space-y-2">
                  <p>
                    Quick increments are pre-defined increments that allow you to quickly set a
                    serial number range for a specific batch size.
                  </p>
                  <p>
                    You must enter a valid starting serial number first, then this will populate the
                    ending serial number.
                  </p>
                </div>
              </HelpPopover>
            </Label>
            <GradientScrollArea className="w-full">
              <div className="flex gap-2">
                {QUICK_INCREMENTS.map((increment) => (
                  <Button
                    key={increment}
                    type="button"
                    variant={
                      parseInt(serialNumberRangeEnd ?? "Infinity") -
                        parseInt(serialNumberRangeStart ?? "-Infinity") ===
                      increment - 1
                        ? "default"
                        : "outline"
                    }
                    disabled={!serialNumberRangeStart}
                    onClick={() => {
                      if (!serialNumberRangeStart) {
                        return;
                      }
                      setSerialNumberRangeEnd(
                        incrementSerialNumber(
                          serialNumberRangeStart,
                          increment - 1 // -1 because the starting number is already included
                        )
                      );
                    }}
                  >
                    {increment.toLocaleString()}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </GradientScrollArea>
            <p className="text-muted-foreground mt-1 text-xs italic">
              Optionally, select a quick increment to populate the ending serial number.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="manual" className="my-4">
          <Label className="mb-2 block">Serial Numbers</Label>
          <Textarea
            placeholder="0000099&#10;0000100&#10;0000101"
            className="w-full font-mono"
            rows={4}
            value={serialNumbers?.join("\n")}
            onChange={(e) => setSerialNumbers(e.target.value.split("\n").map(coerceNumeric))}
          />
          <p className="text-muted-foreground mt-1 text-xs italic">
            Enter one serial number per line.
          </p>
        </TabsContent>
      </Tabs>
    </Step>
  );
}

StepBulkSerialNumberInput.StepId = "bulk-serial-number-input";

const QUICK_INCREMENTS: number[] = [20, 50, 100, 500, 1_000, 5_000, 10_000, 20_000];

const enforceMaxEndingSerialNumber = (
  maxEndingSerialNumber: string | undefined,
  endingSerialNumber: string
) => {
  if (maxEndingSerialNumber && parseInt(endingSerialNumber) > parseInt(maxEndingSerialNumber)) {
    return maxEndingSerialNumber;
  }
  return endingSerialNumber;
};

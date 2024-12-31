import { add } from "date-fns";
import { useRemixForm } from "remix-hook-form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { DatePicker } from "../date-picker";

const DEFAULT_REQUESTED_BY_DATE = add(new Date(), { days: 2 });

export default function AssetOrderRequests() {
  const orderRequestForm = useRemixForm({
    defaultValues: {
      requestedByDate: DEFAULT_REQUESTED_BY_DATE,
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">
        No active supply requests.
      </p>

      <Dialog>
        <Form {...orderRequestForm}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <DialogTrigger asChild>
              <Button type="submit" variant="secondary">
                Create Supply Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Supply Request</DialogTitle>
                <DialogDescription>
                  Please fill out additional details needed to create the order
                  request.
                </DialogDescription>
              </DialogHeader>
              <FormField
                control={orderRequestForm.control}
                name="requestedByDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      How soon do you need the request fulfilled?
                    </FormLabel>
                    <DatePicker
                      min={DEFAULT_REQUESTED_BY_DATE}
                      className="w-full"
                      {...field}
                    />
                    <FormMessage />
                    <FormDescription>
                      Requests need a lead time of at least 2 days.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </DialogContent>
          </form>
        </Form>
      </Dialog>
    </div>
  );
}

import dayjs from "dayjs";
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
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

export default function AssetOrderRequests() {
  const orderRequestForm = useRemixForm({
    defaultValues: {
      requestedByDate: dayjs().add(2, "day").format("YYYY-MM-DD"),
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">No active order requests.</p>

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
                Create Order Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Order Request</DialogTitle>
                <DialogDescription>
                  Please fill out additional details needed to create the order
                  request.
                </DialogDescription>
              </DialogHeader>
              <FormItem>
                <FormLabel>
                  How soon do you need the request fulfilled?
                </FormLabel>
                <Input
                  type="date"
                  min={dayjs().add(2, "day").format("YYYY-MM-DD")}
                  className="col-span-3"
                  {...orderRequestForm.register("requestedByDate")}
                />
                <FormMessage />
                <FormDescription>
                  Requests need a lead time of at least 2 days.
                </FormDescription>
              </FormItem>
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

export function RequiredFieldsNotice() {
  return (
    <div className="bg-primary/20 dark:bg-primary/10 text-primary mb-4 w-fit rounded-md px-2 py-1 text-xs">
      * indicates a required field
    </div>
  );
}

export function RequiredFieldIndicator() {
  return (
    <div className="bg-primary/20 dark:bg-primary/10 text-primary ml-1 inline-block w-fit rounded-md p-1">
      *
    </div>
  );
}

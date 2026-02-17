export class PaymentError extends Error {
  #type = PaymentError.name;
  readonly code: number = 1070;
  readonly value: any;

  constructor(message?: string, value?: Record<string, unknown>) {
    console.log('Payment error message', message);
    super(message);
    this.value = value;
    
    if (value?.error) {
      this.setError(value.error as Error)
    }
  }

  setError(error: Error) {
    this.message = `${this.message} ${error.message}`;
    this.stack = error.stack;

    return this;
  }
}

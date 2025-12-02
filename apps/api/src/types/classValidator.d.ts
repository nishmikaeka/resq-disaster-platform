declare module 'class-validator' {
  export function IsNotEmpty(
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function IsString(
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function IsOptional(
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function IsNumber(
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function IsNumberString(
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function IsIn(
    values: readonly unknown[],
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function IsEmail(
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function IsBoolean(
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function MinLength(
    min: number,
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function MaxLength(
    max: number,
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;

  export interface ValidationOptions {
    message?: string | ((validationArguments: ValidationArguments) => string);
    groups?: string[];
    always?: boolean;
    each?: boolean;
    context?: unknown;
  }

  export interface ValidationArguments {
    value: unknown;
    constraints: unknown[];
    targetName: string;
    object: object;
    property: string;
  }
}

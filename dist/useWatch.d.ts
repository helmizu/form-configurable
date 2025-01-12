import { Form, FormValues } from "./logic/createForm";
interface IStateInitializeWatch {
    values: FormValues;
    name: string[];
}
export declare const initializeWatch: ({ values, name, }: IStateInitializeWatch) => any[];
export declare const useWatch: (props: {
    form?: {
        config: {
            schema: import("./types").Schema[];
            extraData: FormValues;
            values: FormValues;
            initialValues: Record<string, any>;
        };
        props: import("./logic/createForm").Props;
        fields: import("./logic/createForm").Fields;
        refs: Record<string, any>;
        formState: import("./logic/createForm").RootFormState;
        subjects: {
            watchs: any[];
            watchContainer: any[];
        };
        hasError: () => boolean;
        subscribeWatch: (callback: any, subject?: "container" | "state") => (() => void) | undefined;
        notifyWatch: (subject?: "container" | "state") => void;
        updateTouch: (name: string, value?: boolean, shouldRender?: boolean) => void;
        getValue: (name: string) => any;
        getError: (name: string) => string;
        getTouch: (name: string) => boolean;
        setValue: (name: string, value: any, options?: {
            freeze: boolean;
        } | undefined) => void;
        setValues: (values: Record<any, any>, options?: {
            freeze: boolean;
        } | undefined) => void;
        setError: (name: string, value?: any, options?: {
            freeze: boolean;
        } | undefined) => void;
        setErrors: (values: Record<any, any>, options?: {
            freeze: boolean;
        } | undefined) => void;
        setFormState: (formStateValue: Partial<import("./logic/createForm").RootFormState>) => void;
        executeConfig: (name?: string | undefined, options?: {
            skipValidate: boolean;
        }) => void;
        setFocus: (name: string, options?: {
            shouldSelect?: boolean | undefined;
        }) => void;
        reset: (arg?: import("./logic/createForm").CreateFormProps) => void;
    } | undefined;
    name: string[];
}) => any[];
export default useWatch;

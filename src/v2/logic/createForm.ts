/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
import isEqual from "lodash.isequal";
import { FormEvent } from "react";
import get from "../utils/get";
import type {
  IExpressionString,
  IObject,
  ISchema,
  ISchemaFieldArrayDefault,
  ISchemaFieldDefault,
  ISchemaFieldObjectDefault,
} from "../types";
import set from "../utils/set";
import { createParser } from "../parser";

// eslint-disable-next-line no-unused-vars

export interface IState {
  containerFormState: {
    isSubmitting: boolean;
    isSubmitted: boolean;
    isSubmitSuccessful: boolean;
    isValidating: boolean;
  };
  supportFormState: {
    isValid: boolean;
    isDirty: boolean;
  };
  propsState: {
    editable: Record<string, any>;
    show: Record<string, any>;
    [key: string]: Record<string, any>;
  };
  fieldsState: {
    touched: Record<string, boolean>;
    [key: string]: Record<string, any>;
  };
  fieldsRef: Record<string, any>;
  values: Record<string, any>;
  error: Record<string, any>;
}

export interface ISubject {
  fields: any[];
  containers: any[];
  supports: any[];
}

export interface ICreateFormProps<TSchema> {
  initialValues: IState["values"];
  schemas: TSchema[];
  formula?: any;
  extraData?: Record<string, any>;
  log?: (...args: any) => void;
  shouldFocusError?: boolean;
}

export interface IConfig<TSchema> {
  schemas: TSchema[],
  extraData: Record<string, any>;
  initialValues: Record<string, any>;
}

interface IExecuteEachOptions { parent: string; extraData: Record<string, any>; name: string }

type ISchemaFieldAll = ISchemaFieldDefault | ISchemaFieldArrayDefault | ISchemaFieldObjectDefault;

export const initializeState = {
  containerFormState: {
    isSubmitted: false,
    isSubmitSuccessful: false,
    isSubmitting: false,
    isValidating: false,
  },
  supportFormState: {
    isValid: true,
    isDirty: false,
  },
  propsState: {
    editable: {},
    show: {},
  },
  fieldsState: {
    touched: {},
  },
  fieldsRef: {},
  error: {},
  values: {},
};

export function getSchemaKey(schema: ISchema, parent?: string) {
  return `${parent ? `${parent}.` : ""}${schema.config.name ?? schema.key}`;
}

export function getSchemaName(schema: ISchema, parent?: string) {
  if (!schema.config.name) return "";
  return `${parent ? `${parent}.` : ""}${schema.config.name}`;
}

const createForm = <TSchema>(props: ICreateFormProps<TSchema>) => {
  const parser = createParser(props.formula);

  const _config: IConfig<TSchema> = {
    schemas: props.schemas,
    extraData: props.extraData || {},
    initialValues: props.initialValues || {},
  };

  const _state: IState = initializeState;

  const _subject: ISubject = {
    fields: [],
    containers: [],
    supports: [],
  };

  const _fieldRef: Record<string, any> = {};

  const parse = (expression: IExpressionString, terms: Record<string, any> = {}) => parser.expressionToValue(expression, { ..._config.extraData, ..._state.values, ...terms });

  function hasError() { return !!Object.keys(_state.error).length; }
  // values
  function getValue(key?: string) {
    if (!key) return undefined;
    return get(_state.values, key);
  }
  function initValue(key: string, value: any) { set(_state.values, key, value); }
  // fieldState
  function getError(key?: string) {
    if (!key) return undefined;
    return _state.error[key];
  }
  function getTouch(key: string) { return _state.fieldsState.touched[key]; }
  function initError(key: string, value: any) { _state.error[key] = value; }
  function initTouched(key: string, value: any) { _state.fieldsState.touched[key] = value; }
  // propsState
  function getProp(name: keyof IState["propsState"], key: string) { return _state.propsState[name]?.[key] ?? true; }
  function initProp(name: string, key: string, value: any) {
    if (!_state.propsState[name]) _state.propsState[name] = {};
    _state.propsState[name][key] = value;
  }

  function getSchemaFieldState<
    TFieldProps = IObject,
    TFieldState = IObject
  >(schema: ISchema) {
    const key = getSchemaKey(schema);
    const propsState: IObject = {};
    const fieldState: IObject = {};

    // eslint-disable-next-line guard-for-in
    for (const name in _state.propsState) {
      propsState[name] = _state.propsState[name][key];
    }
    // eslint-disable-next-line guard-for-in
    for (const name in _state.fieldsState) {
      fieldState[name] = _state.fieldsState[name][key];
    }

    return {
      value: getValue(key),
      error: getError(key),
      propsState: propsState as TFieldProps,
      fieldState: fieldState as TFieldState,
    };
  }

  function getSchemaViewState<
    TFieldProps = IObject,
  >(schema: ISchema) {
    const key = getSchemaKey(schema);
    const propsState: IObject = {};

    // eslint-disable-next-line guard-for-in
    for (const name in _state.propsState) {
      propsState[name] = _state.propsState[name][key];
    }
    return {
      value: getValue(key),
      propsState: propsState as TFieldProps,
    };
  }

  const subscribe = (subject: keyof ISubject, callback: any) => {
    _subject[subject].push(callback);
    return () => {
      _subject[subject] = _subject[subject].filter((fn) => fn !== callback);
    };
  };

  const notify = (subject: keyof ISubject) => {
    for (const fn of _subject[subject]) {
      fn(_state.values);
    }
  };

  const setFocus = (key: string) => {
    const field = _state.fieldsRef[key]?.current;
    if (!field) {
      props.log?.(`ref "${key}" field not yet registered`);
      return;
    }

    if (field.focus) {
      field.focus();
    } else {
      props.log?.(`ref "${key}" focus not yet registered`);
    }
  };

  const setContainerFormState = (formStateValue: Partial<IState["containerFormState"]>) => {
    Object.assign(_state.containerFormState, formStateValue);
  };

  const setSupportFormState = (formStateValue: Partial<IState["supportFormState"]>) => {
    Object.assign(_state.supportFormState, formStateValue);
  };

  const setIsDirty = (options: { skipNotify: boolean } = { skipNotify: true }) => {
    if (!_state.supportFormState.isDirty) {
      setSupportFormState({
        isDirty: !isEqual(props.initialValues, _state.values),
      });

      if (!options.skipNotify) {
        notify("supports");
      }
    }
  };

  const setSupportFormStateValid = (options: { skipNotify: boolean } = { skipNotify: true }) => {
    const isValid = !hasError();

    if (isValid !== _state.supportFormState.isValid) {
      setSupportFormState({ isValid });

      if (!options.skipNotify) {
        notify("supports");
      }
    }
  };

  const updateTouch = (
    name: string,
    value: boolean = true,
    shouldRender: boolean = true,
  ) => {
    const isPreviousTouched = getTouch(name);
    initTouched(name, value);

    if (shouldRender && isPreviousTouched !== value) {
      notify("fields");
    }
  };

  function setValue(key: string, value: any, options: { skipNotify: boolean } = { skipNotify: false }) {
    initValue(key, value);

    // eslint-disable-next-line no-useless-return
    if (options?.skipNotify) return;

    updateTouch(key, true, false);
    // eslint-disable-next-line no-use-before-define
    executeExpression(key);
    notify("fields");
    setSupportFormStateValid();
    setIsDirty();
  }

  function setValues(values: IState["values"], options: { skipNotify: boolean; } = { skipNotify: false }) {
    Object.entries(values).forEach(([key, value]) => {
      initValue(key, value);
    });

    // eslint-disable-next-line no-useless-return
    if (!options?.skipNotify) return;

    notify("fields");
    setIsDirty();
  }

  const executeEachOverrideSelfExpression = (
    schema: ISchemaFieldAll,
    options: Partial<IExecuteEachOptions> = { parent: "", extraData: {} },
  ) => {
    const key = getSchemaKey(schema, options.parent);
    try {
      initValue(
        key,
        parse(schema.overrideSelf as string, {
          ...options.extraData,
          __SELF__: getValue(key),
        }),
      );
    } catch (error) {
      //
    }
  };

  const executeEachPropsExpression = (
    schema: ISchema,
    options: IExecuteEachOptions = { parent: "", extraData: {}, name: "" },
  ) => {
    const updateProps = (name: string, key: string, configValue: any, terms: any) => {
      const { expressionValue, value } = configValue;
      try {
        const result = (expressionValue ? parse(expressionValue, terms) : value);
        initProp(name, key, result);
      } catch (error) {
        if (value) {
          initProp(name, key, value);
        }
      }
    };

    for (
      const {
        condition = false,
        expression,
        name,
        value,
        expressionValue,
      } of schema.props
    ) {
      const key = getSchemaKey(schema, options.parent);
      const terms = { ...options.extraData, __SELF__: getValue(key) };

      if (!expression) {
        updateProps(name, key, { value, expressionValue }, terms);
        continue;
      }

      try {
        const result = parse(expression, terms);
        if (condition === !!result) {
          updateProps(name, key, { value, expressionValue }, terms);
        }
      } catch (error) {
        if (!condition) {
          updateProps(name, key, { value, expressionValue }, terms);
        }
      }
    }
  };

  const executeEachOverrideExpression = (
    schema: ISchemaFieldAll,
    options: Partial<IExecuteEachOptions> = { parent: "", extraData: {}, name: "" },
  ) => {
    for (const { condition, expression, values } of (schema.overrides || [])) {
      if (!expression) {
        setValues({ ...values }, { skipNotify: true });
        continue;
      }

      try {
        const result = parse(expression, { ...options.extraData });
        if (condition === !!result) {
          setValues({ ...values }, { skipNotify: true });
          break;
        }
      } catch (error) {
        if (!condition) {
          setValues({ ...values }, { skipNotify: true });
          break;
        }
      }
    }
  };

  const executeEachRuleExpression = (
    schema: ISchemaFieldAll,
    options: Partial<IExecuteEachOptions> = { parent: "", extraData: {} },
  ) => {
    const key = getSchemaKey(schema, options.parent);
    for (
      const {
        condition = false,
        expression,
        message,
      } of (schema.rules || [])
    ) {
      try {
        const result = parse(expression, {
          ...options.extraData,
          __SELF__: getValue(key),
        });
        if (condition === !!result) {
          initError(key, message);
          break;
        }
      } catch (error) {
        if (!condition) {
          initError(key, message);
          break;
        }
      }
    }
  };

  const executeEachArrayExpression = (
    schema: TSchema[],
    options: Partial<IExecuteEachOptions> = { parent: "", extraData: {} },
  ) => {
    if (getError(options.parent)) return;

    const value = getValue(options.parent) || [];
    for (let index = 0; index < value.length; index++) {
      // eslint-disable-next-line no-use-before-define
      executeEachExpression(schema as ISchema[], {
        parent: `${options.parent}.${index}`,
        extraData: {
          __INDEX__: index,
        },
      });
    }
  };

  const executeEachObjectExpression = (
    schema: TSchema[],
    options: Partial<IExecuteEachOptions> = { parent: "", extraData: {} },
  ) => {
    if (getError(options.parent)) return;

    // eslint-disable-next-line no-use-before-define
    executeEachExpression(schema as ISchema[], {
      parent: `${options.parent}`,
    });
  };

  const executeEachExpression = (
    schemas: ISchema[],
    options: Partial<IExecuteEachOptions> = { parent: "", extraData: {} },
  ) => {
    if (!schemas) return;

    for (const schema of schemas) {
      const key = getSchemaKey(schema as ISchema, options.parent);

      if (schema.variant === "FIELD" || schema.variant === "FIELD-ARRAY" || schema.variant === "FIELD-OBJECT") {
        if (schema.overrideSelf) {
          executeEachOverrideSelfExpression(schema, options);
        }
        if (options.name === key) {
          executeEachOverrideExpression(schema, options);
        }
      }

      executeEachPropsExpression(schema);

      // skip when show is false
      if (!getProp("show", key) || !getProp("editable", key)) continue;

      if (schema.variant === "FIELD") {
        executeEachRuleExpression(schema, options);
        continue;
      }

      if (schema.variant === "FIELD-ARRAY") {
        executeEachRuleExpression(schema, options);
        executeEachArrayExpression(
          schema.childs as TSchema[],
          {
            ...options,
            parent: key,
          },
        );
        continue;
      }

      if (schema.variant === "FIELD-OBJECT") {
        executeEachRuleExpression(schema, options);
        executeEachObjectExpression(
          schema.childs as TSchema[],
          {
            ...options,
            parent: key,
          },
        );
      }

      if (schema.variant === "GROUP") {
        executeEachExpression(schema.childs as ISchema[], options);
        continue;
      }
    }
  };

  const executeExpression = (name?: string) => {
    _state.error = {};

    // eslint-disable-next-line guard-for-in
    for (const prop in _state.propsState) {
      _state.propsState[prop] = {};
    }

    executeEachExpression(_config.schemas as ISchema[], { extraData: {}, name });
  };

  const initializeValues = (schemas: ISchema[]) => {
    for (const schema of schemas) {
      try {
        if (schema.variant === "FIELD" || schema.variant === "FIELD-ARRAY" || schema.variant === "FIELD-OBJECT") {
          const key = getSchemaKey(schema);
          set(
            _state.values,
            key,
            get(_config.initialValues, key) || schema.initialValue,
          );
        } else if (schema.variant === "GROUP") {
          initializeValues(schema.childs);
        }
      } catch (error) {
        props.log?.("error on initializeValues", error);
      }
    }
  };

  const reset = ({
    initialValues = props.initialValues,
    schemas = props.schemas,
    extraData = props.extraData,
  }: Partial<Omit<ICreateFormProps<TSchema>, "formula">>) => {
    // ===
    _config.schemas = schemas || [];
    _config.initialValues = initialValues || {};
    _config.extraData = extraData || {};
    // ===
    Object.assign(_state, initializeState);

    initializeValues(_config.schemas as ISchema[]);
    executeExpression();
    setSupportFormStateValid();
    notify("containers");
    notify("fields");
    notify("supports");
  };

  const handleSubmit = (
    onValid: (values: IState["values"], state?: IState) => Promise<void> | void,
    onInvalid: (
      values: IState["values"],
      errors: IState["error"],
      type?: "ON-SCHEMA" | "ON-SUBMIT",
      istate?: IState
    ) => void,
    options: { forceSubmit: boolean; } = { forceSubmit: false },
  ) => async (event: FormEvent) => {
    props.log?.("handleSubmit triggered");
    event?.stopPropagation();
    event?.preventDefault();

    try {
      _state.containerFormState.isSubmitting = true;
      notify("containers");

      executeExpression();

      if (hasError() && !options.forceSubmit) {
        _state.containerFormState.isSubmitSuccessful = false;
        onInvalid(_state.values, _state.error, "ON-SCHEMA", _state);
      } else {
        _state.containerFormState.isSubmitSuccessful = true;
        await onValid(_state.values, _state);
      }

      // else {
      //   _state.containerFormState.isSubmitSuccessful = true;
      //   await onValid(_state.values, _state);
      //   //
      // }
    } catch (error) {
      _state.containerFormState.isSubmitSuccessful = false;
      onInvalid(_state.values, _state.error, "ON-SUBMIT", _state);
      //
    } finally {
      _state.containerFormState.isSubmitting = false;
      _state.containerFormState.isSubmitted = true;
      notify("containers");
      notify("fields");
      notify("supports");
    }
  };

  reset({});

  return {
    config: _config,
    state: _state,
    subject: _subject,
    fieldRef: _fieldRef,
    setContainerFormState,
    setSupportFormState,
    getValue,
    setValue,
    getError,
    getProp,
    setValues,
    setFocus,
    handleSubmit,
    reset,
    getTouch,
    subscribe,
    notify,
    getSchemaKey,
    getSchemaFieldState,
    getSchemaViewState,
    updateTouch,
  };
};

export type IForm<T> = ReturnType<typeof createForm<T>>

export default createForm;

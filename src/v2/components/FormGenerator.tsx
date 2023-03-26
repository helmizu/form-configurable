/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable no-use-before-define */
/* eslint-disable react/require-default-props */
/* eslint-disable consistent-return */
/* eslint-disable react/jsx-key */
import { Suspense, useContext, useMemo } from "react";
import { ISchema, ISchemaCore } from "../types";
import ComponentContext from "../contexts/ComponentContext";
import { getSchemaName } from "../logic/createForm";
import set from "../utils/set";
import { FormContext } from "../contexts";
import generateId from "../utils/generateId";

interface IFormGeneratorProps {
  schemas: any[];
  parent: string;
  fallback: any;
  fallbackVariantNotRegistered: any;
  fallbackComponentNotRegisterd: any;
}

interface ISchemaComponentProps extends Omit<IFormGeneratorProps, "schemas"> {
  schema: ISchema;
}

const updateSchemaConfigName = (schema: ISchemaCore, key: string): any => {
  if (!key) return schema;
  const overrideSchema = { ...schema, config: { ...schema.config } };
  set(overrideSchema, "config.name", key);
  return overrideSchema;
};

const updateSchemasAttributTitle = (schemas: ISchema[], index: any) => schemas.map((schema) => {
  const overrideSchema = { ...schema };
  if (overrideSchema?.attribute?.title) {
    overrideSchema.attribute = {
      ...overrideSchema.attribute,
      title: overrideSchema.attribute.title.replace("__ITEM__", `${+index + 1}`),
    };
  }

  return overrideSchema;
});

export function SchemaComponent({
  schema,
  parent,
  fallback,
  fallbackVariantNotRegistered,
  fallbackComponentNotRegisterd,
}: ISchemaComponentProps) {
  const { components } = useContext(ComponentContext);
  const identity = getSchemaName(schema as any, parent);
  const generatedKey = useMemo(() => generateId(), []);

  if (schema.variant === "FIELD") {
    const Component = components[schema.variant][schema.component];
    if (!Component) return fallbackComponentNotRegisterd;

    return (
      <Suspense fallback={fallback}>
        <Component
          schema={updateSchemaConfigName(schema, identity)}
        />
      </Suspense>
    );
  }

  if (schema.variant === "VIEW") {
    const Component = components[schema.variant][schema.component];
    if (!Component) return fallbackComponentNotRegisterd;

    return (
      <Suspense fallback={fallback}>
        <Component
          schema={updateSchemaConfigName(schema, identity)}
        />
      </Suspense>
    );
  }

  if (schema.variant === "GROUP") {
    const Component = components[schema.variant][schema.component];
    if (!Component) return fallbackComponentNotRegisterd;

    return (
      <Suspense fallback={fallback}>
        <Component
          schema={schema}
        >
          <FormGenerator
            parent={parent}
            schemas={schema.childs}
            fallback={fallback}
            fallbackComponentNotRegisterd={fallbackComponentNotRegisterd}
            fallbackVariantNotRegistered={fallbackVariantNotRegistered}
          />
        </Component>
      </Suspense>
    );
  }

  if (schema.variant === "FIELD-ARRAY") {
    const Component = components[schema.variant][schema.component];
    if (!Component) return fallbackComponentNotRegisterd;

    return (
      <Suspense fallback={fallback}>
        <Component
          schema={schema}
        >
          {({ value, container: Container }) => value?.map((data: any, index: number) => (
            // eslint-disable-next-line react/no-array-index-key
            <Container schema={schema} data={data} key={`${parent}-${identity}-${index}-${generatedKey}`}>
              <FormGenerator
                parent={`${identity}.${index}`}
                schemas={updateSchemasAttributTitle(schema.childs, index)}
                fallback={fallback}
                fallbackComponentNotRegisterd={fallbackComponentNotRegisterd}
                fallbackVariantNotRegistered={fallbackVariantNotRegistered}
              />
            </Container>
          ))}
        </Component>
      </Suspense>
    );
  }

  if (schema.variant === "FIELD-OBJECT") {
    const Component = components[schema.variant][schema.component];
    if (!Component) return fallbackComponentNotRegisterd;

    return (
      <Suspense fallback={fallback}>
        <Component
          schema={schema}
        >
          {({ value, container: Container }) => (
            <Container schema={schema} data={value} key={`${identity}`}>
              <FormGenerator
                parent={`${identity}`}
                schemas={schema.childs}
                fallback={fallback}
                fallbackComponentNotRegisterd={fallbackComponentNotRegisterd}
                fallbackVariantNotRegistered={fallbackVariantNotRegistered}
              />
            </Container>
          )}
        </Component>
      </Suspense>
    );
  }

  return fallbackVariantNotRegistered;
}

export function FormGenerator(props: Partial<IFormGeneratorProps>) {
  const { form: formContext } = useContext(FormContext);
  const {
    schemas = formContext.config.schemas,
    parent = "",
    fallback = <></>,
    fallbackVariantNotRegistered = <></>,
    fallbackComponentNotRegisterd = <></>,
  } = props;

  const generatedKey = useMemo(() => generateId(), []);

  return (
    <>
      {(schemas as ISchema[]).map((schema) => {
        const key = schema.variant + schema.component + (schema.config.name || "") + (schema.key || "") + parent + generatedKey;
        return (
          <SchemaComponent
            key={key}
            parent={parent}
            schema={schema}
            fallback={fallback}
            fallbackComponentNotRegisterd={fallbackComponentNotRegisterd}
            fallbackVariantNotRegistered={fallbackVariantNotRegistered}
          />
        );
      })}
    </>
  );
}

export default FormGenerator;
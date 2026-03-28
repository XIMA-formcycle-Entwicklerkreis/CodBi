/**
 * Fills an HTML input element with a greeting message.
 *
 * Place `data-cb-func="Example.HelloWorld"` on any `<input>` element.
 * The Functionality reads the **name** parameter and writes
 * `"Hello, <name>!"` into the input's value.
 *
 * @codbi-param name — The name to greet (default: "World")
 */
class Example_HelloWorld {
    public static functionality(
        element: HTMLInputElement,
        params: Record<string, string>,
    ): void {
        const name = params["name"] || "World";
        element.value = `Hello, ${name}!`;
    }
}

CodBi.registerFunctionality("Example.HelloWorld", Example_HelloWorld.functionality);

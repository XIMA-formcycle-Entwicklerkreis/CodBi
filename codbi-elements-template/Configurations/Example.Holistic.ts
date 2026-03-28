/**
 * Holistic Configuration that wires **Example.HelloWorld** together
 * with the **Example.CurrentDate** EP.
 *
 * It selects all elements matching `.greeting[data-cb-name]` and
 * applies the Functionality with parameters from the element's dataset,
 * then invokes the EP on a sibling `.date-display` element.
 *
 * @codbi-css  greeting     — Container class for greeted input elements
 * @codbi-css  date-display — Class for the element that shows the current date
 * @codbi-global exampleGreetingDefault — Default name when none is provided
 */
(function () {
    const defaultName =
        CodBi.loadConfig("Configurations.Example.Holistic", "exampleGreetingDefault") || "World";

    document.querySelectorAll<HTMLElement>(".greeting[data-cb-name]").forEach((container) => {
        const input = container.querySelector<HTMLInputElement>("input");
        const dateEl = container.querySelector<HTMLElement>(".date-display");

        if (input) {
            CodBi.invokeFunctionality("Example.HelloWorld", input, {
                name: container.dataset.cbName || defaultName,
            });
        }

        if (dateEl) {
            CodBi.invokeEP("Example.CurrentDate", dateEl, { format: "locale" });
        }
    });
})();

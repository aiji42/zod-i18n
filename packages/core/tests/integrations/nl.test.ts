import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "nl";

beforeAll(async () => {
	await init(LOCALE);
});

test("string parser error messages", () => {
	const schema = z.string();

	expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Vereist");
	expect(getErrorMessage(schema.safeParse(1))).toEqual("Ongeldig type: nummer. Type tekst vereist");
	expect(getErrorMessage(schema.safeParse(true))).toEqual("Ongeldig type: boolean. Type tekst vereist");
	expect(getErrorMessage(schema.safeParse(Date))).toEqual("Ongeldig type: functie. Type tekst vereist");
	expect(getErrorMessage(schema.safeParse(new Date()))).toEqual("Ongeldig type: datum. Type tekst vereist");
	expect(getErrorMessage(schema.email().safeParse(""))).toEqual("Ongeldige e-mail");
	expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Ongeldige url");
	expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual("Ongeldig");
	expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual('Ongeldige invoer: moet beginnen met "foo"');
	expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual('Ongeldige invoer: moet eindigen met "bar"');
	expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual("Tekst moet minstens 5 karakter(s) bevatten");
	expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual("Tekst mag niet meer dan 5 karakter(s) bevatten");
	expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual("Tekst moet precies 5 karakter(s) bevatten");
	expect(getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))).toEqual("Ongeldige datumtijd");
});

test("number parser error messages", () => {
	const schema = z.number();

	expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Vereist");
	expect(getErrorMessage(schema.safeParse(""))).toEqual("Ongeldig type: tekst. Type nummer vereist");
	expect(getErrorMessage(schema.safeParse(null))).toEqual("Ongeldig type: null. Type nummer vereist");
	expect(getErrorMessage(schema.safeParse(NaN))).toEqual("Ongeldig type: nan. Type nummer vereist");
	expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual("Ongeldig type: kommagetal. Type geheel getal vereist");
	expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual("Getal moet een veelvoud zijn van 5");
	expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual("Getal moet een veelvoud zijn van 0.1");
	expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual("Getal moet kleiner zijn dan 5");
	expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual("Getal moet 5 of kleiner zijn");
	expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual("Getal moet groter zijn dan 5");
	expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual("Getal moet 5 of groter zijn");
	expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual("Getal moet 0 of groter zijn");
	expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual("Getal moet 0 of kleiner zijn");
	expect(getErrorMessage(schema.negative().safeParse(1))).toEqual("Getal moet kleiner zijn dan 0");
	expect(getErrorMessage(schema.positive().safeParse(0))).toEqual("Getal moet groter zijn dan 0");
	expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual("Getal moet finiet zijn");
});

test("date parser error messages", async () => {
	const testDate = new Date("2022-08-01");
	const schema = z.date();

	expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual("Ongeldig type: tekst. Type datum vereist");
	expect(getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))).toEqual(
		`Datum moet op of later dan ${testDate.toLocaleDateString(LOCALE)} zijn`
	);
	expect(getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))).toEqual(
		`Datum moet op of eerder dan ${testDate.toLocaleDateString(LOCALE)} zijn`
	);
	try {
		await schema.parseAsync(new Date("invalid"));
	} catch (err) {
		expect((err as z.ZodError).issues[0].message).toEqual("Ongeldige datum");
	}
});

test("array parser error messages", () => {
	const schema = z.string().array();

	expect(getErrorMessage(schema.safeParse(""))).toEqual("Ongeldig type: tekst. Type array vereist");
	expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual("Array moet minstens 5 element(en) bevatten");
	expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual("Array mag niet meer dan 2 element(en) bevatten");
	expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual("Array moet minstens 1 element(en) bevatten");
	expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual("Array moet precies 2 element(en) bevatten");
});

test("function parser error messages", () => {
	const functionParse = z.function(z.tuple([z.string()]), z.number()).parse((a: any) => a);
	expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual("Ongeldig functietype teruggegeven waarde");
	expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual("Ongeldige functieargumenten");
});

test("other parser error messages", () => {
	expect(
		getErrorMessage(
			z
				.intersection(
					z.number(),
					z.number().transform(x => x + 1)
				)
				.safeParse(1234)
		)
	).toEqual("Types konden niet worden samengevoegd");
	expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual("Ongeldige letterlijke waarde, vereist 12");
	expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual("Waarde 'D' is ongeldig. Antwoordmogelijkheden zijn: 'A' | 'B' | 'C'");
	expect(getErrorMessage(z.object({ dog: z.string() }).strict().safeParse({ dog: "", cat: "", rat: "" }))).toEqual(
		"Onbekende sleutel(s) in object: 'cat', 'rat'"
	);
	expect(
		getErrorMessage(
			z
				.discriminatedUnion("type", [z.object({ type: z.literal("a"), a: z.string() }), z.object({ type: z.literal("b"), b: z.string() })])
				.safeParse({ type: "c", c: "abc" })
		)
	).toEqual("Ongeldige discriminatorwaarde. vereist 'a' | 'b'");
	expect(getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))).toEqual("Ongeldige invoer");
	expect(
		getErrorMessage(
			z
				.string()
				.refine(() => {
					return false;
				})
				.safeParse("")
		)
	).toEqual("Ongeldige invoer");
});

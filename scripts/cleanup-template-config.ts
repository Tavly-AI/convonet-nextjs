import {
    Node,
    Project,
    SyntaxKind,
    Type,
    type ObjectLiteralExpression,
} from "ts-morph"

const project = new Project({
    tsConfigFilePath: "tsconfig.json",
})

const templateFile = project.getSourceFileOrThrow(
    "app/agents/_data/templates-data-list.tsx"
)

const typesFile = project.getSourceFileOrThrow(
    "app/agents/_lib/session-storage/agent-session.ts"
)

const configType = typesFile
    .getTypeAliasOrThrow("AgentSessionConfig")
    .getType()

const llmConfigType = typesFile
    .getTypeAliasOrThrow("AgentSessionLlmConfig")
    .getType()

let removed = 0

// ================================================================
// Resolve optional + discriminated union types
// ================================================================

function resolveExpectedType(
    object: ObjectLiteralExpression,
    expectedType: Type
): Type {
    // Removes null | undefined
    expectedType = expectedType.getNonNullableType()

    if (!expectedType.isUnion()) {
        return expectedType
    }

    const unionTypes = expectedType
        .getUnionTypes()
        .map((type) => type.getNonNullableType())

    // Look for discriminant:
    //
    // {
    //   type: "custom"
    // }
    //
    // {
    //   type: "send_sms"
    // }
    const typeProperty = object.getProperty("type")

    if (
        typeProperty &&
        Node.isPropertyAssignment(typeProperty)
    ) {
        const initializer = typeProperty.getInitializer()

        if (
            initializer &&
            Node.isStringLiteral(initializer)
        ) {
            const discriminator = initializer.getLiteralValue()

            const matchingType = unionTypes.find((unionType) => {
                const symbol = unionType.getProperty("type")

                if (!symbol) {
                    return false
                }

                const declaration = symbol.getValueDeclaration()

                if (!declaration) {
                    return false
                }

                const discriminatorType =
                    symbol.getTypeAtLocation(declaration)

                return discriminatorType
                    .getUnionTypes()
                    .concat(discriminatorType)
                    .some((type) => {
                        return (
                            type.isStringLiteral() &&
                            type.getLiteralValue() === discriminator
                        )
                    })
            })

            if (matchingType) {
                return matchingType
            }
        }
    }

    /*
     * If this is NOT a discriminated union, don't guess.
     *
     * Returning expectedType means we won't accidentally choose
     * the wrong union member and delete valid fields.
     */
    return expectedType
}

// ================================================================
// Get all allowed properties
// ================================================================

function getAllowedProperties(expectedType: Type) {
    expectedType = expectedType.getNonNullableType()

    /*
     * If a union still exists here, allow properties from ALL
     * members.
     *
     * This is safer than deleting valid data.
     */
    if (expectedType.isUnion()) {
        return new Map(
            expectedType
                .getUnionTypes()
                .flatMap((type) => type.getProperties())
                .map((property) => [
                    property.getName(),
                    property,
                ])
        )
    }

    return new Map(
        expectedType
            .getProperties()
            .map((property) => [
                property.getName(),
                property,
            ])
    )
}

// ================================================================
// Recursive cleaner
// ================================================================

function removeUnknownProperties(
    object: ObjectLiteralExpression,
    expectedType: Type,
    path: string
) {
    expectedType = expectedType.getNonNullableType()

    // Don't recurse into completely unrestricted values.
    if (expectedType.isUnknown() || expectedType.isAny()) {
        return
    }

    expectedType = resolveExpectedType(
        object,
        expectedType
    )

    const allowedProperties =
        getAllowedProperties(expectedType)

    // IMPORTANT:
    // Handles Record<string, X>
    //
    // Example:
    // properties: Record<string, FunctionParameterSchema>
    const stringIndexType =
        expectedType.getStringIndexType()

    for (const property of [...object.getProperties()]) {
        if (Node.isSpreadAssignment(property)) {
            continue
        }

        if (!Node.isPropertyAssignment(property)) {
            continue
        }

        const name = property.getName()
        const initializer = property.getInitializer()

        if (!initializer) {
            continue
        }

        const expectedProperty =
            allowedProperties.get(name)

        let propertyType: Type | undefined

        // Normal explicitly defined property
        if (expectedProperty) {
            const declaration =
                expectedProperty.getValueDeclaration()

            if (declaration) {
                propertyType = expectedProperty
                    .getTypeAtLocation(declaration)
                    .getNonNullableType()
            }
        }

        // Dynamic property from Record<string, X>
        else if (stringIndexType) {
            propertyType =
                stringIndexType.getNonNullableType()
        }

        // Actually invalid
        else {
            console.log(`❌ Removing: ${path}.${name}`)
            property.remove()
            removed++
            continue
        }

        if (!propertyType) {
            continue
        }

        // Nested object
        if (Node.isObjectLiteralExpression(initializer)) {
            removeUnknownProperties(
                initializer,
                propertyType,
                `${path}.${name}`
            )

            continue
        }

        // Array
        if (Node.isArrayLiteralExpression(initializer)) {
            const elementType = propertyType
                .getNonNullableType()
                .getArrayElementType()

            if (!elementType) {
                continue
            }

            initializer
                .getElements()
                .forEach((element, index) => {
                    if (!Node.isObjectLiteralExpression(element)) {
                        return
                    }

                    removeUnknownProperties(
                        element,
                        elementType,
                        `${path}.${name}[${index}]`
                    )
                })
        }
    }
}

// ================================================================
// CONFIG
// ================================================================

const configProperties = templateFile
    .getDescendantsOfKind(
        SyntaxKind.PropertyAssignment
    )
    .filter(
        (property) =>
            property.getName() === "config"
    )

for (const property of configProperties) {
    const object =
        property.getInitializerIfKind(
            SyntaxKind.ObjectLiteralExpression
        )

    if (!object) {
        continue
    }

    removeUnknownProperties(
        object,
        configType,
        "config"
    )
}

// ================================================================
// LLM CONFIG
// ================================================================

const llmConfigProperties = templateFile
    .getDescendantsOfKind(
        SyntaxKind.PropertyAssignment
    )
    .filter(
        (property) =>
            property.getName() === "llmConfig"
    )

for (const property of llmConfigProperties) {
    const object =
        property.getInitializerIfKind(
            SyntaxKind.ObjectLiteralExpression
        )

    if (!object) {
        continue
    }

    removeUnknownProperties(
        object,
        llmConfigType,
        "llmConfig"
    )
}

console.log()
console.log(
    `✅ Removed ${removed} unknown properties.`
)

templateFile.saveSync()
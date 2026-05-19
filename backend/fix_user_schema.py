"""
Patches the MongoDB users collection validator to add 'employee' to the allowed roles enum.
Run once: python fix_schema.py
"""
import asyncio
import sys
sys.path.insert(0, ".")
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings


async def main():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    database = client.suraksha_maps

    # Fetch current validator
    info = await database.command("listCollections", filter={"name": "users"})
    collections = info.get("cursor", {}).get("firstBatch", [])
    if not collections:
        print("users collection not found — it will be created without a strict validator.")
        client.close()
        return

    current_opts = collections[0].get("options", {})
    current_validator = current_opts.get("validator", {})
    print("Current validator:", current_validator)

    # Patch: update the role enum to include 'employee'
    schema = current_validator.get("$jsonSchema", {})
    props = schema.get("properties", {})
    if "role" in props:
        existing_enum = props["role"].get("enum", [])
        if "employee" not in existing_enum:
            existing_enum.append("employee")
            props["role"]["enum"] = existing_enum
            schema["properties"] = props
            current_validator["$jsonSchema"] = schema
            print("Patched role enum to:", existing_enum)
        else:
            print("'employee' already in enum — nothing to do.")
    else:
        # No role property in schema — just log
        print("No role property in validator schema — validator may be loose.")

    # Apply updated validator
    await database.command(
        "collMod",
        "users",
        validator=current_validator,
        validationLevel="moderate",  # moderate = only validates new inserts/updates
    )
    print("Validator updated successfully.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())

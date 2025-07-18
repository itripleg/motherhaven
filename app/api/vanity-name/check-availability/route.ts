// app/api/vanity-name/check-availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import {
  VanityNameValidationError,
  VANITY_NAME_CONSTANTS,
  type VanityNameDocument,
} from "@/types/vanity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    console.log("🔍 Checking availability for name:", name);

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        {
          available: false,
          reason: "Invalid name provided",
        },
        { status: 400 }
      );
    }

    // Basic validation
    if (name.length < VANITY_NAME_CONSTANTS.MIN_LENGTH) {
      return NextResponse.json({
        available: false,
        reason: VanityNameValidationError.TOO_SHORT,
        message: `Name must be at least ${VANITY_NAME_CONSTANTS.MIN_LENGTH} characters`,
      });
    }

    if (name.length > VANITY_NAME_CONSTANTS.MAX_LENGTH) {
      return NextResponse.json({
        available: false,
        reason: VanityNameValidationError.TOO_LONG,
        message: `Name must be no more than ${VANITY_NAME_CONSTANTS.MAX_LENGTH} characters`,
      });
    }

    if (!VANITY_NAME_CONSTANTS.ALLOWED_CHARACTERS.test(name)) {
      return NextResponse.json({
        available: false,
        reason: VanityNameValidationError.INVALID_CHARACTERS,
        message: "Name can only contain letters, numbers, and underscores",
      });
    }

    // Check reserved names
    if (
      VANITY_NAME_CONSTANTS.RESERVED_NAMES.includes(name.toLowerCase() as any)
    ) {
      return NextResponse.json({
        available: false,
        reason: VanityNameValidationError.RESERVED,
        message: "This name is reserved and cannot be used",
      });
    }

    // Check if name exists in Firebase
    const lowerName = name.toLowerCase();
    try {
      const nameDoc = await getDoc(
        doc(db, VANITY_NAME_CONSTANTS.COLLECTION_NAMES.VANITY_NAMES, lowerName)
      );

      if (nameDoc.exists()) {
        const nameData = nameDoc.data() as VanityNameDocument;
        console.log(`❌ Name "${name}" is taken by:`, nameData.owner);
        return NextResponse.json({
          available: false,
          reason: VanityNameValidationError.ALREADY_TAKEN,
          message: "This name is already taken",
        });
      }
    } catch (firebaseError) {
      console.error("❌ Firebase error checking name:", firebaseError);
      // Continue with other checks even if Firebase fails
    }

    // Check for profanity (basic implementation)
    const profanityList = [
      // Add your profanity filter words here
      "admin",
      "system",
      "root",
      "api",
      "null",
      "undefined",
      "test",
      // Add more as needed
    ];

    if (profanityList.some((word) => lowerName.includes(word))) {
      return NextResponse.json({
        available: false,
        reason: VanityNameValidationError.PROFANITY,
        message: "This name contains restricted content",
      });
    }

    console.log(`✅ Name "${name}" is available`);
    return NextResponse.json({
      available: true,
      name: name,
      message: "Name is available!",
    });
  } catch (error) {
    console.error("❌ Error checking name availability:", error);
    return NextResponse.json(
      {
        available: false,
        reason: "Server error checking availability",
        message: "Unable to check availability. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      message: "Use POST to check name availability",
      endpoint: "/api/vanity-name/check-availability",
      method: "POST",
      example: {
        body: {
          name: "username",
        },
        response: {
          available: true,
          name: "username",
          message: "Name is available!",
        },
      },
      validation: {
        minLength: VANITY_NAME_CONSTANTS.MIN_LENGTH,
        maxLength: VANITY_NAME_CONSTANTS.MAX_LENGTH,
        allowedCharacters: "Letters, numbers, and underscores only",
        reservedNames: VANITY_NAME_CONSTANTS.RESERVED_NAMES,
      },
    },
    { status: 405 }
  );
}

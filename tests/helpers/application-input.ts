import { applicationSchema, type ApplicationInput } from "@/lib/validations/application";

const file = (name: string) => ({
  publicId: `oedf-dev/applications/${name}`,
  resourceType: "image" as const,
  originalName: `${name}.pdf`,
});

/** A valid admission application, parsed the way the API parses it. Override fields as needed. */
export function buildApplicationInput(overrides: Record<string, unknown> = {}): ApplicationInput {
  return applicationSchema.parse({
    type: "ADMISSION",
    intakeSession: "Fall 2026",
    applicant: {
      fullName: "Ayesha Khan",
      guardianName: "Imran Khan",
      dateOfBirth: "2008-04-12",
      gender: "FEMALE",
      cnic: "35202-1234567-1",
      email: "Ayesha@Example.org",
      phone: "0300 1234567",
      address: "House 1, Street 2",
      city: "Vehari",
    },
    education: {
      lastInstitution: "Govt High School",
      classOrDegree: "Matric",
      boardOrUniversity: "BISE Multan",
      marksOrPercentage: "85%",
      passingYear: 2024,
    },
    documents: { photo: file("photo"), identity: file("identity"), resultCard: file("result") },
    declaration: true,
    ...overrides,
  });
}

export const scholarshipExtras = {
  type: "SCHOLARSHIP",
  financial: {
    monthlyIncomePkr: 40000,
    familySize: 6,
    guardianOccupation: "Shopkeeper",
    otherSupport: "",
    statementOfNeed: "We cannot afford the fees.",
  },
  documents: {
    photo: file("photo"),
    identity: file("identity"),
    resultCard: file("result"),
    incomeProof: file("income"),
  },
};

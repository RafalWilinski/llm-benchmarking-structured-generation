import { z } from "zod";

export const wideJsonSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  age: z.number().int(),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
  occupation: z.string(),
  company: z.string(),
  salary: z.number(),
  isEmployed: z.boolean(),
  startDateTime: z.string(),
  department: z.string(),
  skills: z.array(z.string()),
  education: z.string(),
  maritalStatus: z.string(),
  hobbies: z.array(z.string()),
  favoriteColor: z.string(),
  website: z.string(),
  socialMedia: z.object({}),
  languages: z.array(z.string()),
  hasCar: z.boolean(),
  height: z.number(),
  weight: z.number(),
  achievements: z.array(z.string()),
});

export const complexJsonSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  details: z.object({
    personalInfo: z.object({
      age: z.number().int(),
      contact: z.object({
        email: z.string(),
        phone: z.string(),
        address: z.object({
          street: z.string(),
          city: z.string(),
          country: z.string(),
          postalCode: z.string(),
        }),
      }),
    }),
    professionalInfo: z.object({
      occupation: z.string(),
      experience: z.array(
        z.object({
          company: z.string(),
          position: z.string(),
          startDateTime: z.string(),
          endDateTime: z.string(),
          achievements: z.array(z.string()),
        })
      ),
      skills: z.array(
        z.object({
          name: z.string(),
          level: z.enum(["beginner", "intermediate", "expert"]),
        })
      ),
    }),
  }),
  preferences: z.object({
    favoriteColors: z.array(z.string()),
    hobbies: z.array(
      z.object({
        name: z.string(),
        frequency: z.string(),
        equipment: z.array(z.string()),
      })
    ),
  }),
  metadata: z.object({
    lastUpdated: z.string(),
    version: z.string(),
    dataSource: z.string(),
  }),
});

export const superComplexJsonSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  details: z.object({
    personalInfo: z.object({
      age: z.number().int(),
      dateOfBirth: z.string(),
      nationality: z.string(),
      maritalStatus: z.enum(["single", "married", "divorced", "widowed"]),
      contact: z.object({
        email: z.string(),
        phone: z.string(),
        alternativePhone: z.string(),
        address: z.object({
          street: z.string(),
          city: z.string(),
          state: z.string(),
          country: z.string(),
          postalCode: z.string(),
          latitude: z.number(),
          longitude: z.number(),
        }),
      }),
    }),
    professionalInfo: z.object({
      occupation: z.string(),
      currentEmployer: z.string(),
      yearsOfExperience: z.number().int(),
      education: z.array(
        z.object({
          institution: z.string(),
          degree: z.string(),
          fieldOfStudy: z.string(),
          graduationYear: z.number().int(),
          gpa: z.number(),
        })
      ),
      certifications: z.array(
        z.object({
          name: z.string(),
          issuingOrganization: z.string(),
          dateObtained: z.string(),
          expirationDate: z.string(),
        })
      ),
      experience: z.array(
        z.object({
          company: z.string(),
          position: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          isCurrent: z.boolean(),
          responsibilities: z.array(z.string()),
          skills: z.array(z.string()),
          reportsTo: z.string(),
        })
      ),
      skills: z.array(
        z.object({
          name: z.string(),
          category: z.string(),
          level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
          yearsOfExperience: z.number(),
        })
      ),
      languages: z.array(
        z.object({
          language: z.string(),
          proficiency: z.enum(["basic", "conversational", "fluent", "native"]),
          certifications: z.array(z.string()),
        })
      ),
    }),
  }),
  preferences: z.object({
    favoriteColors: z.array(z.string()),
    hobbies: z.array(
      z.object({
        name: z.string(),
        category: z.string(),
        frequency: z.string(),
        yearsOfExperience: z.number(),
        relatedSkills: z.array(z.string()),
      })
    ),
    travelPreferences: z.object({
      accommodationType: z.enum(["hotel", "hostel", "airbnb", "camping"]),
      budgetPerDay: z.number(),
      preferredTransportation: z.array(z.string()),
    }),
    dietaryRestrictions: z.array(z.string()),
    workPreferences: z.object({
      preferredWorkEnvironment: z.enum(["office", "remote", "hybrid"]),
      desiredSalary: z.number(),
      willingToRelocate: z.boolean(),
      preferredIndustries: z.array(z.string()),
    }),
  }),
  financialInfo: z.object({
    income: z.number(),
    expenses: z.number(),
    assets: z.array(
      z.object({
        type: z.string(),
        value: z.number(),
        purchaseDate: z.string(),
      })
    ),
    liabilities: z.array(
      z.object({
        type: z.string(),
        amount: z.number(),
        interestRate: z.number(),
      })
    ),
  }),
  healthInfo: z.object({
    height: z.number(),
    weight: z.number(),
    medications: z.array(
      z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
      })
    ),
    chronicConditions: z.array(z.string()),
    lastCheckup: z.string(),
  }),
  metadata: z.object({
    createdAt: z.string(),
    lastUpdated: z.string(),
    dataSource: z.string(),
    accessLevel: z.enum(["public", "private", "restricted"]),
    tags: z.array(z.string()),
  }),
});

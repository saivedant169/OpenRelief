import type { PolicyPack } from "../core/src/openrelief";

export const californiaWildfirePolicyPack: PolicyPack = {
  id: "california-wildfire-v1",
  name: "California Wildfire Recovery V1",
  jurisdiction: "California",
  disasterType: "wildfire",
  version: "0.1.0",
  sources: [
    {
      id: "fema-appeals",
      title: "Appeal FEMA's Decision",
      publisher: "FEMA",
      url: "https://www.fema.gov/assistance/individual/after-applying/appeals",
      retrievedAt: "2026-07-13",
      trustTier: 1
    },
    {
      id: "fema-documents",
      title: "Documents Needed for FEMA Assistance",
      publisher: "FEMA",
      url: "https://www.fema.gov/assistance/individual/after-applying",
      retrievedAt: "2026-07-13",
      trustTier: 1
    },
    {
      id: "sba-disaster",
      title: "Disaster Assistance",
      publisher: "U.S. Small Business Administration",
      url: "https://www.sba.gov/funding-programs/disaster-assistance",
      retrievedAt: "2026-07-13",
      trustTier: 1
    }
  ],
  rules: [
    {
      id: "appeal-human-review",
      topic: "appeal",
      statement: "Denial or appeal cases should be reviewed by a human helper before the survivor relies on generated text.",
      sourceIds: ["fema-appeals"]
    },
    {
      id: "occupancy-proof",
      topic: "documents",
      statement: "Proof of occupancy can be relevant when an assistance letter asks for residence documentation.",
      sourceIds: ["fema-documents"]
    },
    {
      id: "insurance-info",
      topic: "documents",
      statement: "Insurance information may be needed when disaster assistance asks for duplicated-benefit review.",
      sourceIds: ["fema-documents"]
    },
    {
      id: "sba-path",
      topic: "loans",
      statement: "SBA disaster assistance can be a separate recovery path for eligible disaster losses.",
      sourceIds: ["sba-disaster"]
    }
  ]
};


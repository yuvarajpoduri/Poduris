let familyData = {
  family: [],
};

// Fetch all family members
async function fetchFamilyData() {
  try {
    const response = await fetch("http://localhost:3000/api/family");
    const result = await response.json();

    familyData.family = result.map((doc) => ({
      id: doc.id,
      name: doc.name,
      birthDate: doc.birthDate,
      deathDate: doc.deathDate,
      gender: doc.gender,
      parentId: doc.parentId,
      spouseId: doc.spouseId,
      generation: doc.generation,
      avatar: doc.avatar,
      occupation: doc.occupation || "",
      location: doc.location || "",
      bio: doc.bio || "",
    }));

    return familyData;
  } catch (error) {
    console.error("Error fetching family data:", error);
    return getFallbackData();
  }
}

// Add new family member
async function addFamilyMember(memberData) {
  try {
    console.log("Adding member with data:", memberData);

    const response = await fetch("http://localhost:3000/api/family", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add family member");
    }

    const newMember = await response.json();
    console.log("New member added:", newMember);

    // Add to local data
    familyData.family.push(newMember);

    return { success: true, data: newMember };
  } catch (error) {
    console.error("Error adding family member:", error);
    return { success: false, message: error.message };
  }
}

// Update family member
async function updateFamilyMember(id, memberData) {
  try {
    console.log("Updating member", id, "with data:", memberData);

    const response = await fetch(`http://localhost:3000/api/family/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update family member");
    }

    const updatedMember = await response.json();
    console.log("Member updated:", updatedMember);

    // Update local data
    const index = familyData.family.findIndex((member) => member.id === id);
    if (index !== -1) {
      familyData.family[index] = updatedMember;
    }

    return { success: true, data: updatedMember };
  } catch (error) {
    console.error("Error updating family member:", error);
    return { success: false, message: error.message };
  }
}

// Delete family member
async function deleteFamilyMember(id) {
  try {
    console.log("Deleting member with id:", id);

    const response = await fetch(`http://localhost:3000/api/family/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete family member");
    }

    const result = await response.json();
    console.log("Member deleted:", result);

    // Remove from local data
    familyData.family = familyData.family.filter((member) => member.id !== id);

    return { success: true, message: "Family member deleted successfully" };
  } catch (error) {
    console.error("Error deleting family member:", error);
    return { success: false, message: error.message };
  }
}

// Get family member by ID
function getFamilyMemberById(id) {
  return familyData.family.find((member) => member.id === id);
}

// Fallback data for offline/error scenarios
function getFallbackData() {
  familyData = {
    family: [
      {
        id: 1,
        name: "Sample Member",
        birthDate: "1950-01-01",
        deathDate: "",
        gender: "male",
        parentId: null,
        spouseId: null,
        generation: 1,
        avatar: "",
        occupation: "",
        location: "",
        bio: "",
      },
    ],
  };
  return familyData;
}

// Initialize family data on page load
async function initializeFamilyData() {
  try {
    await fetchFamilyData();
    console.log("Family data loaded:", familyData.family.length, "members");

    window.dispatchEvent(
      new CustomEvent("familyDataLoaded", {
        detail: { familyData },
      })
    );
  } catch (error) {
    console.error("Error initializing family data:", error);
  }
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing family data...");
  initializeFamilyData();
});

// Export API functions
window.familyDataAPI = {
  getFamilyData: () => familyData,
  getFamilyMemberById,
  addMember: addFamilyMember,
  updateMember: updateFamilyMember,
  deleteMember: deleteFamilyMember,
  refreshData: fetchFamilyData,
};

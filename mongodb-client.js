let familyData = {
  family: [],
};

async function fetchFamilyData() {
  try {
    const response = await fetch("/api/family");
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

async function addFamilyMember(memberData) {
  try {
    console.log("Adding member with data:", memberData);

    const response = await fetch("api/family", {
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
    familyData.family.push(newMember);

    return { success: true, data: newMember };
  } catch (error) {
    console.error("Error adding family member:", error);
    return { success: false, message: error.message };
  }
}

async function updateFamilyMember(id, memberData) {
  try {
    console.log("Updating member", id, "with data:", memberData);

    const response = await fetch(
      `/api/family/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(memberData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update family member");
    }

    const updatedMember = await response.json();
    console.log("Member updated:", updatedMember);

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

async function deleteFamilyMember(id) {
  try {
    console.log("Deleting member with id:", id);

    const response = await fetch(
      `/api/family/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete family member");
    }

    const result = await response.json();
    console.log("Member deleted:", result);

    familyData.family = familyData.family.filter((member) => member.id !== id);

    return { success: true, message: "Family member deleted successfully" };
  } catch (error) {
    console.error("Error deleting family member:", error);
    return { success: false, message: error.message };
  }
}

function getFamilyMemberById(id) {
  return familyData.family.find((member) => member.id === id);
}
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

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing family data...");
  initializeFamilyData();
});

window.familyDataAPI = {
  getFamilyData: () => familyData,
  getFamilyMemberById,
  addMember: addFamilyMember,
  updateMember: updateFamilyMember,
  deleteMember: deleteFamilyMember,
  refreshData: fetchFamilyData,
};

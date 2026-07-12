export const crtGrpvalidnSchema=
{
  Group_name:{
      notEmpty: {
        errorMessage: "Group name can't be empty"
      },
      isLength: {
        options: { min: 6, max: 12 },
        errorMessage: "Group min of 3 and max 12 chars"
      }
  },
  Owner:
  {
    notEmpty: {
        errorMessage: "Owner of the grp should be known"
      }
  }
};
export const addUservalidnSchema=
{
  user_name:{
      notEmpty: {
        errorMessage: "USER_name can't be empty"
      },
      isLength: {
        options: { min: 3, max: 12 },
        errorMessage: "USER_Name min of 3 and max 12 chars"
      }
  },
  password:
  {
    notEmpty: {
        errorMessage: "Password can't be empty"
      }
  },
  email_id:
  {
    notEmpty: {
        errorMessage: "Email id can't be empty"
      }
  }
};
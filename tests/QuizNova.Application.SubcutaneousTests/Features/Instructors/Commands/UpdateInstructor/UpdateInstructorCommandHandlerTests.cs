using FluentAssertions;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Instructors.Commands.CreateInstructor;
using QuizNova.Application.Features.Instructors.Commands.UpdateInstructor;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Instructors.Commands.UpdateInstructor;

public class UpdateInstructorCommandHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var command = new UpdateInstructorCommand(
            Guid.Empty,
            new PersonalInformationDto("Valid Name", "instructor@example.com", "+123456789"));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<UpdateInstructorCommand>(x => x.Id) &&
            e.Description == UpdateInstructorCommandValidator.ErrorMessages.IdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var nonExistentId = Guid.NewGuid();
        var command = new UpdateInstructorCommand(
            nonExistentId,
            new PersonalInformationDto("Valid Name", "instructor@example.com", "+123456789"));

        // Act
        var result = await mediator.Send(command);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.InstructorNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingId_ShouldUpdateSuccessfully()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create a valid Instructor first
        var uniqueEmail1 = $"instructor_{Guid.NewGuid()}@example.com";
        var uniquePhone1 = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createCommand = new CreateInstructorCommand(
            new PersonalInformationDto("Original Name", uniqueEmail1, uniquePhone1),
            "SecurePass123!",
            nameof(UserRole.Instructor));
        var createResult = await mediator.Send(createCommand);
        createResult.IsSuccess.Should().BeTrue();

        var instructorId = createResult.Value.Id;

        // 2. Prepare Update Command
        var uniqueEmail2 = $"instructor_{Guid.NewGuid()}@example.com";
        var uniquePhone2 = $"+1{Guid.NewGuid().ToString()[..10]}";
        var updateCommand = new UpdateInstructorCommand(
            instructorId,
            new PersonalInformationDto("Updated Instructor Name", uniqueEmail2, uniquePhone2));

        // Act
        var updateResult = await mediator.Send(updateCommand);

        // Assert
        updateResult.IsSuccess.Should().BeTrue();
        updateResult.Value.PersonalInformation.Name.Should().Be("Updated Instructor Name");
        updateResult.Value.PersonalInformation.Email.Should().Be(uniqueEmail2);

        // Verify updated in database
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        var instructorInDb = await mongoContext.Users.Find(u => u.UserRole == UserRole.Instructor && u.Id == instructorId).FirstOrDefaultAsync();

        instructorInDb.Should().NotBeNull();
        instructorInDb.PersonalInformation.Name.Should().Be("Updated Instructor Name");
        instructorInDb.PersonalInformation.Email.Should().Be(uniqueEmail2);
        instructorInDb.PersonalInformation.PhoneNumber.Should().Be(uniquePhone2);
    }

    [Fact]
    public async Task Handle_WithInvalidData_ShouldReturnValidationError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // Create Instructor
        var uniqueEmail = $"instructor_{Guid.NewGuid()}@example.com";
        var uniquePhone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createCommand = new CreateInstructorCommand(
            new PersonalInformationDto("Original Name", uniqueEmail, uniquePhone),
            "SecurePass123!",
            nameof(UserRole.Instructor));
        var createResult = await mediator.Send(createCommand);
        var instructorId = createResult.Value.Id;

        // Update with name too short
        var updateCommand = new UpdateInstructorCommand(
            instructorId,
            new PersonalInformationDto("Ab", uniqueEmail, uniquePhone));

        // Act
        var result = await mediator.Send(updateCommand);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == $"{nameof(UpdateInstructorCommand.PersonalInformation)}.{nameof(PersonalInformationDto.Name)}" &&
            e.Description == UpdateInstructorCommandValidator.ErrorMessages.NameMinLength);
    }

    [Fact]
    public async Task Handle_WithDuplicateEmailForAnotherUser_ShouldReturnDuplicateEmailError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create Instructor A
        var emailA = $"instructor_{Guid.NewGuid()}@example.com";
        var phoneA = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createA = new CreateInstructorCommand(
            new PersonalInformationDto("Instructor A", emailA, phoneA),
            "SecurePass123!",
            nameof(UserRole.Instructor));
        var resA = await mediator.Send(createA);
        resA.IsSuccess.Should().BeTrue();

        // 2. Create Instructor B
        var emailB = $"instructor_{Guid.NewGuid()}@example.com";
        var phoneB = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createB = new CreateInstructorCommand(
            new PersonalInformationDto("Instructor B", emailB, phoneB),
            "SecurePass123!",
            nameof(UserRole.Instructor));
        var resB = await mediator.Send(createB);
        var instructorBId = resB.Value.Id;

        // 3. Try to update Instructor B's email to match Instructor A
        var updateCommand = new UpdateInstructorCommand(
            instructorBId,
            new PersonalInformationDto("Instructor B Updated", emailA, phoneB));

        // Act
        var result = await mediator.Send(updateCommand);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.UserEmailAlreadyExists(string.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithDuplicatePhoneNumberForAnotherUser_ShouldReturnDuplicatePhoneNumberError()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // 1. Create Instructor A
        var emailA = $"instructor_{Guid.NewGuid()}@example.com";
        var phoneA = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createA = new CreateInstructorCommand(
            new PersonalInformationDto("Instructor A", emailA, phoneA),
            "SecurePass123!",
            nameof(UserRole.Instructor));
        var resA = await mediator.Send(createA);
        resA.IsSuccess.Should().BeTrue();

        // 2. Create Instructor B
        var emailB = $"instructor_{Guid.NewGuid()}@example.com";
        var phoneB = $"+1{Guid.NewGuid().ToString()[..10]}";
        var createB = new CreateInstructorCommand(
            new PersonalInformationDto("Instructor B", emailB, phoneB),
            "SecurePass123!",
            nameof(UserRole.Instructor));
        var resB = await mediator.Send(createB);
        var instructorBId = resB.Value.Id;

        // 3. Try to update Instructor B's phone number to match Instructor A
        var updateCommand = new UpdateInstructorCommand(
            instructorBId,
            new PersonalInformationDto("Instructor B Updated", emailB, phoneA));

        // Act
        var result = await mediator.Send(updateCommand);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.UserPhoneNumberAlreadyExists(string.Empty).Code);
    }

    private void EnsureAdminContext()
    {
        var adminId = Guid.Parse(TestUsers.Admin.User.Id);
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
        if (!mongoContext.Users.Find(u => u.UserRole == UserRole.Admin && u.Id == adminId).Any())
        {
            var personalInfo = PersonalInformation.Create("Admin User", "admin@quiznova.local", "01000000000").Value;
            var admin = Admin.Create(adminId, personalInfo).Value;
            mongoContext.Users.InsertOne(admin);
        }

        TestCurrentUser.Set(TestUsers.Admin.User);
    }
}

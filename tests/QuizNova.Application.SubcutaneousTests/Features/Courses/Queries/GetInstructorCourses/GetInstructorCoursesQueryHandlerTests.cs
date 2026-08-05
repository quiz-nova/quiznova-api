using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Courses.Commands.CreateCourse;
using QuizNova.Application.Features.Courses.Queries.GetInstructorCourses;
using QuizNova.Application.Features.Instructors.Commands.CreateInstructor;
using QuizNova.Application.Features.Users.DTOs;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Tests.Common.Security;

namespace QuizNova.Application.SubcutaneousTests.Features.Courses.Queries.GetInstructorCourses;

public class GetInstructorCoursesQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyInstructorId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetInstructorCoursesQuery(Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetInstructorCoursesQuery>(x => x.InstructorId) &&
            e.Description == GetInstructorCoursesQueryValidator.ErrorMessages.InstructorIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentInstructorId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetInstructorCoursesQuery(Guid.NewGuid());

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e => e.Code == "Instructor_NotFound");
    }

    [Fact]
    public async Task Handle_WithValidInstructorIdWithCourses_ShouldReturnCourses()
    {
        // Arrange
        EnsureAdminContext();
        var mediator = factory.CreateMediator();

        // Create an instructor
        var email = $"inst_{Guid.NewGuid()}@test.com";
        var phone = $"+1{Guid.NewGuid().ToString()[..10]}";
        var instructorResult = await mediator.Send(new CreateInstructorCommand(
            PersonalInformation: new PersonalInformationDto("Test Instructor", email, phone),
            Password: "SecurePass1!",
            Role: nameof(UserRole.Instructor)));
        instructorResult.IsSuccess.Should().BeTrue();
        var instructorId = instructorResult.Value.Id;

        // Create a course assigned to this instructor
        var courseResult = await mediator.Send(new CreateCourseCommand(
            Name: "Instructor Course Query Test",
            InstructorId: instructorId,
            MinimumPassingMarks: 50,
            MaximumMarks: 100));
        courseResult.IsSuccess.Should().BeTrue();

        // Act
        var result = await mediator.Send(new GetInstructorCoursesQuery(instructorId));

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
        result.Value.Should().Contain(c => c.CourseName == "Instructor Course Query Test");
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

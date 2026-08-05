using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using MongoDB.Driver;

using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.Enrollments.Commands.EnrollStudentInCourse;
using QuizNova.Application.Features.Quizzes.Commands.CreateQuiz;
using QuizNova.Application.Features.Quizzes.Queries.GetStudentQuizzes;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.Users.Admins;
using QuizNova.Domain.Entities.Users.UserPersonalInformation;
using QuizNova.Infrastructure.Identity;
using QuizNova.Tests.Common.Security;
using QuizNova.Tests.Common.Users.Students;
using QuizNova.Tests.Common.Users.UserPersonalInformation;

namespace QuizNova.Application.SubcutaneousTests.Features.Quizzes.Queries.GetStudentQuizzes;

public class GetStudentQuizzesQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyStudentId_ShouldReturnValidationError()
    {
        var mediator = factory.CreateMediator();
        var query = new GetStudentQuizzesQuery(Guid.Empty);

        var result = await mediator.Send(query);

        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetStudentQuizzesQuery>(x => x.StudentId) &&
            e.Description == GetStudentQuizzesQueryValidator.ErrorMessages.StudentIdRequired);
    }

    [Fact]
    public async Task Handle_WithValidStudentButNoEnrollments_ShouldReturnEmptyList()
    {
        var mediator = factory.CreateMediator();

        Guid studentId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            var student = StudentFactory.CreateStudent(
                personalInformation: PersonalInformationFactory
                    .CreatePersonalInformation(
                        name: "No Enrollments Student",
                        email: $"student_{Guid.NewGuid()}@example.com")).Value;

            await mongoContext.Users.InsertOneAsync(student);

            studentId = student.Id;
        }

        var query = new GetStudentQuizzesQuery(studentId);

        var result = await mediator.Send(query);

        result.IsSuccess.Should().BeTrue();
        result.Value.Quizzes.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WithValidStudentAndQuizzes_ShouldReturnStudentQuizzes()
    {
        var mediator = factory.CreateMediator();

        Guid studentId;
        Guid courseId;
        Guid instructorId;
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            studentId = (await mongoContext.Users.Find(u => u.UserRole == UserRole.Student).FirstAsync()).Id;
            var course = await mongoContext.Courses.Find(_ => true).FirstAsync();
            courseId = course.Id;
            instructorId = course.InstructorId!.Value;
        }

        // Enroll student and create quiz
        EnsureAdminContext();
        var enrollResult = await mediator.Send(new EnrollStudentInCourseCommand(courseId, studentId));
        if (enrollResult.IsError)
        {
            enrollResult.TopError.Code.Should().Be("Course_Student_Already_Enrolled");
        }

        var questions = new List<CreateQuestionCommand>
        {
            new CreateTfCommand("Question 1", 1, true),
            new CreateTfCommand("Question 2", 1, false),
            new CreateTfCommand("Question 3", 1, true),
        };
        var quizTitle = $"Quiz {Guid.NewGuid().ToString()[..8]}";
        TestCurrentUser.Set(new AppUser { Id = instructorId.ToString() });
        var quizResult = await mediator.Send(new CreateQuizCommand(quizTitle, courseId,
            DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(1).AddHours(1), questions));
        quizResult.IsSuccess.Should().BeTrue();

        var query = new GetStudentQuizzesQuery(studentId);

        var result = await mediator.Send(query);

        result.IsSuccess.Should().BeTrue();
        result.Value.Quizzes.Should().NotBeEmpty();
        result.Value.Quizzes.Should().Contain(q => q.Title == quizTitle);
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

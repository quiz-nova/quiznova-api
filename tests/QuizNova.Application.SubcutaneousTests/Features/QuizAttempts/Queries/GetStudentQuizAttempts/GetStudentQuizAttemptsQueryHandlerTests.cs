using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using QuizNova.Application.Common.Errors;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Features.QuizAttempts.Queries.GetStudentQuizAttempts;
using QuizNova.Application.SubcutaneousTests.Common;
using QuizNova.Tests.Common.Courses;
using QuizNova.Tests.Common.QuizAttempts;
using QuizNova.Tests.Common.Quizzes;
using QuizNova.Tests.Common.Users.Instructors;
using QuizNova.Tests.Common.Users.Students;

namespace QuizNova.Application.SubcutaneousTests.Features.QuizAttempts.Queries.GetStudentQuizAttempts;

public class GetStudentQuizAttemptsQueryHandlerTests(CustomWebApplicationFactory factory)
    : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task Handle_WithEmptyStudentId_ShouldReturnValidationError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetStudentQuizAttemptsQuery(Guid.Empty);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.Errors.Should().Contain(e =>
            e.Code == ValidationTestExtensions.GetPropertyPath<GetStudentQuizAttemptsQuery>(x => x.StudentId) &&
            e.Description == GetStudentQuizAttemptsQueryValidator.ErrorMessages.StudentIdRequired);
    }

    [Fact]
    public async Task Handle_WithNonExistentStudentId_ShouldReturnNotFoundError()
    {
        // Arrange
        var mediator = factory.CreateMediator();
        var query = new GetStudentQuizAttemptsQuery(Guid.NewGuid());

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsError.Should().BeTrue();
        result.TopError.Code.Should().Be(ApplicationErrors.QuizAttemptStudentNotFound(Guid.Empty).Code);
    }

    [Fact]
    public async Task Handle_WithExistingStudentId_ShouldReturnList()
    {
        // Arrange
        var mediator = factory.CreateMediator();

        var student = StudentFactory.CreateStudent().Value;
        var instructor = InstructorFactory.CreateInstructor().Value;
        var course = CourseFactory.CreateCourse(instructorId: instructor.Id).Value;
        var quiz = QuizFactory.CreateQuiz(courseId: course.Id, instructorId: instructor.Id).Value;
        var attempt = QuizAttemptFactory.CreateQuizAttempt(quizId: quiz.Id, studentId: student.Id).Value;

        // Save directly to DB
        using (var scope = factory.Services.CreateScope())
        {
            var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();
            await mongoContext.Users.InsertOneAsync(student);
            await mongoContext.Users.InsertOneAsync(instructor);
            await mongoContext.Courses.InsertOneAsync(course);

            await mongoContext.Quizzes.InsertOneAsync(quiz);
            await mongoContext.QuizAttempts.InsertOneAsync(attempt);
        }

        var query = new GetStudentQuizAttemptsQuery(student.Id);

        // Act
        var result = await mediator.Send(query);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Should().ContainSingle(a => a.QuizAttemptId == attempt.Id);
    }
}

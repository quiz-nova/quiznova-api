using System.Net;

using FluentAssertions;

using MongoDB.Driver;

using QuizNova.Api.DTOs.Requests;
using QuizNova.Api.IntegrationTests.Common;
using QuizNova.Application.Common.Interfaces;
using QuizNova.Application.Common.Models;
using QuizNova.Application.Features.QuizAttempts.DTOs;
using QuizNova.Domain.Entities.Identity;
using QuizNova.Domain.Entities.QuizAttempts;
using QuizNova.Domain.Entities.QuizAttempts.Answers.ManuallyGradedAnswers.EssayAnswer;
using QuizNova.Domain.Entities.Quizzes;
using QuizNova.Domain.Entities.Quizzes.Questions;
using QuizNova.Tests.Common.Security;

using Xunit;

namespace QuizNova.Api.IntegrationTests.Controllers;

public class GradingControllerTests(CustomWebApplicationFactory factory) : IClassFixture<CustomWebApplicationFactory>
{
    [Fact]
    public async Task GetPendingManualAnswers_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();

        // Act
        var response = await client.GetAsync("/quiz-attempts/manually-graded-answers");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetPendingManualAnswers_WhenStudent_ReturnsForbidden()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Student.User.Email!, TestUsers.Student.Password, "Student");

        // Act
        var response = await client.GetAsync("/quiz-attempts/manually-graded-answers");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetPendingManualAnswers_WhenAdmin_ReturnsForbidden()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Admin.User.Email!, TestUsers.Admin.Password, "Admin");

        // Act
        var response = await client.GetAsync("/quiz-attempts/manually-graded-answers");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetPendingManualAnswers_WhenValidInstructor_ReturnsOkAndPaginatedList()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Instructor1.User.Email!, TestUsers.Instructor1.Password, "Instructor");

        // Seed an answer belonging to this instructor
        await SeedManualAnswerAsync(TestUsers.Instructor1.User.Email!);

        // Act
        var response = await client.GetAsync("/quiz-attempts/manually-graded-answers");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<PaginatedList<PendingManualAnswersDto>>();
        result.Should().NotBeNull();
        result.Items.Should().NotBeEmpty();
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    [InlineData(1, 0)]
    [InlineData(1, -5)]
    [InlineData(1, 101)]
    public async Task GetPendingManualAnswers_WithInvalidPagination_ReturnsBadRequest(int pageNumber, int pageSize)
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Instructor1.User.Email!, TestUsers.Instructor1.Password, "Instructor");

        // Act
        var response =
            await client.GetAsync(
                $"/quiz-attempts/manually-graded-answers?PageNumber={pageNumber}&PageSize={pageSize}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GradeQuestion_WhenValid_ReturnsNoContent()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Instructor1.User.Email!, TestUsers.Instructor1.Password, "Instructor");

        var (_, answerId, _) = await SeedManualAnswerAsync(TestUsers.Instructor1.User.Email!);
        var request = new GradeQuestionRequest(8, "Excellent explanation of REST API principles!");

        // Act
        var response = await client.PutAsJsonAsync($"/quiz-attempts/manually-graded-answers/{answerId}", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task GradeQuestion_WithInvalidScore_ReturnsBadRequest()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Instructor1.User.Email!, TestUsers.Instructor1.Password, "Instructor");

        var (_, answerId, _) = await SeedManualAnswerAsync(TestUsers.Instructor1.User.Email!);

        // Negative score is invalid
        var request = new GradeQuestionRequest(-5, "Score is invalid.");

        // Act
        var response = await client.PutAsJsonAsync($"/quiz-attempts/manually-graded-answers/{answerId}", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GradeQuestion_WithNonExistentAnswer_ReturnsNotFound()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Instructor1.User.Email!, TestUsers.Instructor1.Password, "Instructor");

        var nonExistentId = Guid.NewGuid();
        var request = new GradeQuestionRequest(5, "Valid feedback");

        // Act
        var response = await client.PutAsJsonAsync($"/quiz-attempts/manually-graded-answers/{nonExistentId}", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GradeQuestion_Twice_ReturnsConflict()
    {
        // Arrange
        using var client = factory.CreateAppHttpClient();
        await client.AuthenticateAsync(TestUsers.Instructor1.User.Email!, TestUsers.Instructor1.Password, "Instructor");

        var (_, answerId, _) = await SeedManualAnswerAsync(TestUsers.Instructor1.User.Email!);
        var firstRequest = new GradeQuestionRequest(7, "First valid grade");
        var secondRequest = new GradeQuestionRequest(9, "Trying to grade a second time");

        // Act
        // 1. Grade the first time
        var firstResponse =
            await client.PutAsJsonAsync($"/quiz-attempts/manually-graded-answers/{answerId}", firstRequest);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.NoContent, await firstResponse.Content.ReadAsStringAsync());

        // 2. Grade a second time (should be refused!)
        var secondResponse =
            await client.PutAsJsonAsync($"/quiz-attempts/manually-graded-answers/{answerId}", secondRequest);

        // Assert
        secondResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    private async Task<(Guid attemptId, Guid answerId, Guid questionId)> SeedManualAnswerAsync(string instructorEmail)
    {
        using var scope = factory.Services.CreateScope();
        var mongoContext = scope.ServiceProvider.GetRequiredService<IMongoDbContext>();

        var instructor = await mongoContext.Users
                             .Find(u => u.UserRole == UserRole.Instructor &&
                                        u.PersonalInformation.Email == instructorEmail)
                             .FirstOrDefaultAsync()
                         ?? throw new InvalidOperationException($"Instructor {instructorEmail} not found.");

        var course = await mongoContext.Courses.Find(c => c.InstructorId == instructor.Id).FirstOrDefaultAsync();
        if (course is null)
        {
            course = await mongoContext.Courses.Find(_ => true).FirstAsync();
            course.UpdateInstructor(instructor.Id);
            await mongoContext.Courses.ReplaceOneAsync(c => c.Id == course.Id, course);
        }

        var student = await mongoContext.Users.Find(u => u.UserRole == UserRole.Student).FirstOrDefaultAsync()
                      ?? throw new InvalidOperationException("No students found in database.");

        var quizId = Guid.NewGuid();

        var questionArgs = new List<CreateQuestionArgs>
        {
            new CreateEssayArgs("Question 1Text", 10, "Ref 1"),
            new CreateEssayArgs("Question 2Text", 10, "Ref 2"),
            new CreateEssayArgs("Explain REST API principles in detail.", 10, "Ref 3"),
        };

        var quiz = Quiz.Create(
            quizId,
            course.Id,
            instructor.Id,
            course.Name,
            instructor.PersonalInformation.Name,
            "Essay Quiz",
            DateTimeOffset.UtcNow.AddDays(1),
            DateTimeOffset.UtcNow.AddDays(2),
            questionArgs,
            course).Value;

        var questionId = quiz.Questions.Last().Id;

        var attemptId = Guid.NewGuid();
        var answerId = Guid.NewGuid();
        var answer = EssayAnswer.Create(
            answerId,
            student.Id,
            questionId,
            attemptId,
            "REST stands for Representational State Transfer...",
            10).Value;

        var attempt = QuizAttempt.Start(
            attemptId,
            student.Id,
            quizId,
            DateTime.UtcNow.AddMinutes(2),
            quiz.EndsAtUtc).Value;
        attempt.SubmitAnswer(answer);
        attempt.Complete(DateTime.UtcNow.AddMinutes(4));

        await mongoContext.Quizzes.InsertOneAsync(quiz);
        await mongoContext.QuizAttempts.InsertOneAsync(attempt);

        return (attemptId, answerId, questionId);
    }
}

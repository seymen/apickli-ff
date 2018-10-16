Feature: Response code assertions

  Scenario: should assert response code correctly
    When I GET /status/400
    Then response code should be 400
    And response code should not be 200

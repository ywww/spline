/*
 * Copyright 2019 ABSA Group Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package za.co.absa.spline.consumer.service.repo

import com.arangodb.ArangoDatabaseAsync
import com.arangodb.model.AqlQueryOptions
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Repository
import za.co.absa.spline.consumer.service.model.{ExecutionEvent, PageRequest, Pageable}

import scala.collection.JavaConverters._
import scala.compat.java8.FutureConverters._
import scala.concurrent.{ExecutionContext, Future}

@Repository
class ExecutionEventRepositoryImpl @Autowired()(db: ArangoDatabaseAsync) extends ExecutionEventRepository{

  override def findByTimestampRange(timestampStart: String, timestampEnd: String, pageRequest: PageRequest)(implicit ec: ExecutionContext): Future[Pageable[ExecutionEvent]] = {

    val query = db.query(
      """
        LET executionEvents = (
                    FOR p IN progress
                        FILTER p._creationTimestamp < TO_NUMBER(@asAtTime) && p.timestamp > TO_NUMBER(@timestampStart) && p.timestamp < TO_NUMBER(@timestampEnd)
                        LIMIT @offset, @size
                        RETURN p
                )

                LET res = (
                    FOR ee IN executionEvents
                        LET res = FIRST(
                            FOR po IN progressOf
                                FILTER po._from == ee._id
                                LET exec = FIRST(
                                    FOR exec IN execution
                                        FILTER exec._id == po._to
                                        RETURN exec
                                )
                                LET ope = FIRST(
                                    FOR ex IN executes
                                        FILTER ex._from == exec._id
                                        LET o = FIRST(
                                            FOR op IN operation
                                                FILTER op._id == ex._to
                                                RETURN op
                                        )
                                        RETURN o
                                )
                                RETURN {
                                    "frameworkName" : CONCAT([exec.extra.systemInfo.name, " ", exec.extra.systemInfo.version]),
                                    "applicationName" : exec.extra.appName,
                                    "applicationId" : ee.extra.appId,
                                    "timestamp" : ee.timestamp,
                                    "datasource" : ope.properties.outputSource,
                                    "datasourceType" : ope.properties.destinationType,
                                    "append" : ope.properties.append
                                }
                        )
                        RETURN res
                )

                RETURN res
      """,
      Map(
        "timestampStart" -> timestampStart,
        "timestampEnd" -> timestampEnd,
        "asAtTime"-> pageRequest.asAtTime.toString,
        "offset" -> pageRequest.offset.asInstanceOf[AnyRef],
        "size" -> pageRequest.size.asInstanceOf[AnyRef]
      ).asJava,
      new AqlQueryOptions().fullCount(true),
      classOf[Array[ExecutionEvent]]
    )

    val res = for {
      query <- query.toScala
      fullCount = query.getStats.getFullCount
      if query.hasNext
    } yield ( query.next, fullCount )

    res.map(r=> new Pageable[ExecutionEvent](r._1, r._2, pageRequest.offset, pageRequest.size))
  }
}
